using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Application.UseCases.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

public sealed class AuthController : BaseApiController
{
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized("AUTH_INVALID_TOKEN", "Invalid token.");

        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user is null)
            return NotFound("USER_NOT_FOUND", "User not found.");

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email?.Value ?? string.Empty,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var command = new RefreshTokenCommand(request.RefreshToken);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized("AUTH_INVALID_TOKEN", "Invalid token.");

        var command = new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword);
        await Mediator.Send(command, ct);
        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth-strict")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        await Mediator.Send(new ForgotPasswordCommand(request.Email), ct);
        return Ok(new { message = "Si el correo existe, recibirás un enlace para restablecer tu contraseña." });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth-strict")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        try
        {
            await Mediator.Send(new ResetPasswordCommand(request.Token, request.NewPassword), ct);
            return Ok(new { message = "Contraseña restablecida exitosamente." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest("INVALID_TOKEN", ex.Message);
        }
    }

    [HttpPost("request-access")]
    [EnableRateLimiting("auth-strict")]
    public async Task<IActionResult> RequestAccess([FromBody] RequestAccessRequest request, CancellationToken ct)
    {
        try
        {
            var result = await Mediator.Send(new RequestAccessCommand(
                request.Email, request.FullName, request.AccessCategoryId,
                (request.AuthorMetadata ?? []).Select(v => new GuIA.Application.UseCases.AuthorMetadata.AuthorMetadataInput(v.FieldId, v.Value ?? string.Empty, v.RepeatIndex)).ToList(),
                request.AuthorizesPublication, request.ConsentText), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            const string prefix = "CATEGORIA:";
            if (ex.Message.StartsWith(prefix))
                return BadRequest("INVALID_CATEGORY", ex.Message[prefix.Length..].Trim());
            const string metaPrefix = "METADATA_FIELD:";
            if (ex.Message.StartsWith(metaPrefix))
                return BadRequest("METADATA_FIELD", ex.Message[metaPrefix.Length..].Trim());
            return BadRequest("DUPLICATE_EMAIL", ex.Message);
        }
    }

    /// <summary>Perfil de autor del usuario logueado: campos de su categoría + valores + consentimiento.</summary>
    [HttpGet("my-author-metadata")]
    [Authorize]
    public async Task<IActionResult> GetMyAuthorMetadata(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized("AUTH_INVALID_TOKEN", "Invalid token.");

        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
        var user = await context.Users
            .Include(u => u.AuthorMetadataValues)
            .Include(u => u.AccessCategory)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return NotFound("USER_NOT_FOUND", "User not found.");

        var fields = user.AccessCategoryId.HasValue
            ? await context.AuthorMetadataFields
                .Include(f => f.Options)
                .Where(f => f.AccessCategoryId == user.AccessCategoryId.Value && !f.IsHidden)
                .OrderBy(f => f.SortOrder)
                .ToListAsync(ct)
            : new List<GuIA.Domain.Entities.AuthorMetadataField>();

        var valuesByField = user.AuthorMetadataValues
            .GroupBy(v => v.AuthorMetadataFieldId)
            .ToDictionary(g => g.Key, g => g.OrderBy(v => v.RepeatIndex).Select(v => v.Value).ToList());

        var settings = await context.AuthorMetadataSettings.FirstOrDefaultAsync(ct);

        return Ok(new
        {
            categoryId = user.AccessCategoryId,
            categoryName = user.AccessCategory?.Name,
            authorizesPublication = user.AuthorizesPublication,
            dataConsentAt = user.DataConsentAt,
            consentText = settings?.ConsentText ?? string.Empty,
            fields = fields.Select(f => new
            {
                id = f.Id,
                internalName = f.InternalName,
                label = f.Label,
                fieldType = f.FieldType.ToString(),
                obligatoriness = f.Obligatoriness.ToString(),
                isRepeatable = f.IsRepeatable,
                helpText = f.HelpText,
                options = f.Options.OrderBy(o => o.SortOrder).Select(o => new { value = o.Value, label = o.Label, isDefault = o.IsDefault }).ToList(),
                values = valuesByField.TryGetValue(f.Id, out var vals) ? vals : new List<string>()
            }).ToList()
        });
    }

    /// <summary>Guarda el perfil de autor del usuario logueado (valores + consentimiento).</summary>
    [HttpPut("my-author-metadata")]
    [Authorize]
    public async Task<IActionResult> UpdateMyAuthorMetadata([FromBody] SaveAuthorMetadataRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized("AUTH_INVALID_TOKEN", "Invalid token.");

        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return NotFound("USER_NOT_FOUND", "User not found.");

        try
        {
            var writer = HttpContext.RequestServices.GetRequiredService<GuIA.Application.UseCases.AuthorMetadata.AuthorMetadataWriter>();
            await writer.SaveAsync(userId, user.AccessCategoryId,
                (request.Values ?? []).Select(v => new GuIA.Application.UseCases.AuthorMetadata.AuthorMetadataInput(v.FieldId, v.Value ?? string.Empty, v.RepeatIndex)).ToList(),
                ct);
        }
        catch (InvalidOperationException ex)
        {
            const string metaPrefix = "METADATA_FIELD:";
            if (ex.Message.StartsWith(metaPrefix))
                return BadRequest("METADATA_FIELD", ex.Message[metaPrefix.Length..].Trim());
            return BadRequest("USER_ERROR", ex.Message);
        }

        if (request.AuthorizesPublication.HasValue)
        {
            var settings = await context.AuthorMetadataSettings.FirstOrDefaultAsync(ct);
            user.SetPublicationConsent(request.AuthorizesPublication.Value, settings?.ConsentText);
            await context.SaveChangesAsync(ct);
        }

        return Ok(new { message = "Perfil de autor actualizado." });
    }
}

public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshTokenRequest(string RefreshToken);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Token, string NewPassword);
public sealed record RequestAccessRequest(
    string Email,
    string FullName,
    Guid? AccessCategoryId = null,
    List<AuthorMetadataValueInput>? AuthorMetadata = null,
    bool AuthorizesPublication = false,
    string? ConsentText = null);
