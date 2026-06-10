using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Application.UseCases.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
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
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        await Mediator.Send(new ForgotPasswordCommand(request.Email), ct);
        return Ok(new { message = "Si el correo existe, recibirás un enlace para restablecer tu contraseña." });
    }

    [HttpPost("reset-password")]
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
    public async Task<IActionResult> RequestAccess([FromBody] RequestAccessRequest request, CancellationToken ct)
    {
        try
        {
            var result = await Mediator.Send(new RequestAccessCommand(request.Email, request.FullName), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest("DUPLICATE_EMAIL", ex.Message);
        }
    }
}

public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshTokenRequest(string RefreshToken);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Token, string NewPassword);
public sealed record RequestAccessRequest(string Email, string FullName);
