using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

[Route("api/author-metadata")]
[ApiController]
public class AuthorMetadataController : ControllerBase
{
    private readonly IAppDbContext _context;

    public AuthorMetadataController(IAppDbContext context)
    {
        _context = context;
    }

    private IActionResult BadRequest(string code, string message, string? details = null)
        => base.BadRequest(ApiResponse<object>.Fail(code, message, details));

    /// <summary>Texto de consentimiento vigente (público, para el formulario de solicitar acceso).</summary>
    [HttpGet("settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var settings = await _context.AuthorMetadataSettings.FirstOrDefaultAsync(ct);
        return Ok(new { consentText = settings?.ConsentText ?? string.Empty });
    }

    [HttpPut("settings")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateConsentRequest request, CancellationToken ct)
    {
        var settings = await _context.AuthorMetadataSettings.FirstOrDefaultAsync(ct);
        if (settings == null)
        {
            settings = new AuthorMetadataSettings(request.ConsentText);
            _context.AuthorMetadataSettings.Add(settings);
        }
        else
        {
            settings.UpdateConsentText(request.ConsentText);
        }
        await _context.SaveChangesAsync(ct);
        return Ok(new { message = "Texto de consentimiento actualizado." });
    }

    /// <summary>Campos visibles de una categoría (público, para el formulario de solicitar acceso).</summary>
    [HttpGet("categories/{categoryId:guid}/fields")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFieldsForCategory(Guid categoryId, CancellationToken ct)
    {
        var fields = await _context.AuthorMetadataFields
            .Include(f => f.Options)
            .Where(f => f.AccessCategoryId == categoryId && !f.IsHidden)
            .OrderBy(f => f.SortOrder)
            .Select(f => AuthorMetadataFieldDto.FromEntity(f))
            .ToListAsync(ct);

        return Ok(fields);
    }

    /// <summary>Todos los campos de todas las categorías (staff, para la página admin).</summary>
    [HttpGet("fields")]
    [Authorize]
    public async Task<IActionResult> GetAllFields(CancellationToken ct)
    {
        var fields = await _context.AuthorMetadataFields
            .Include(f => f.AccessCategory)
            .Include(f => f.Options)
            .OrderBy(f => f.AccessCategory.SortOrder).ThenBy(f => f.SortOrder)
            .Select(f => new AuthorMetadataFieldAdminDto
            {
                AccessCategoryId = f.AccessCategoryId,
                CategoryName = f.AccessCategory != null ? f.AccessCategory.Name : null,
                Id = f.Id,
                InternalName = f.InternalName,
                Label = f.Label,
                FieldType = f.FieldType.ToString(),
                Obligatoriness = f.Obligatoriness.ToString(),
                IsRepeatable = f.IsRepeatable,
                IsHidden = f.IsHidden,
                SortOrder = f.SortOrder,
                HelpText = f.HelpText,
                Options = f.Options.OrderBy(o => o.SortOrder).Select(o => new AuthorFieldOptionDto
                {
                    Id = o.Id,
                    Value = o.Value,
                    Label = o.Label,
                    IsDefault = o.IsDefault,
                    SortOrder = o.SortOrder
                }).ToList()
            })
            .ToListAsync(ct);

        return Ok(fields);
    }

    [HttpPost("{categoryId:guid}/fields")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> CreateField(Guid categoryId, [FromBody] CreateAuthorFieldRequest request, CancellationToken ct)
    {
        var category = await _context.AccessCategories
            .FirstOrDefaultAsync(c => c.Id == categoryId, ct);
        if (category == null)
            return NotFound(new { message = "Categoría no encontrada" });

        if (string.IsNullOrWhiteSpace(request.InternalName) || string.IsNullOrWhiteSpace(request.Label))
            return BadRequest(new { message = "InternalName y Label son obligatorios" });

        var duplicate = await _context.AuthorMetadataFields
            .AnyAsync(f => f.AccessCategoryId == categoryId && f.InternalName == request.InternalName, ct);
        if (duplicate)
            return BadRequest(new { message = "Ya existe un campo con ese nombre interno en esta categoría" });

        if (!Enum.TryParse<FieldType>(request.FieldType, ignoreCase: true, out var fieldType))
            return BadRequest(new { message = "FieldType inválido" });
        if (!Enum.TryParse<ObligatorinessLevel>(request.Obligatoriness, ignoreCase: true, out var obligatoriness))
            return BadRequest(new { message = "Obligatoriness inválido" });

        if (fieldType == FieldType.Select && string.IsNullOrWhiteSpace(request.OptionsPipe))
            return BadRequest(new { message = "Los campos de tipo Select requieren opciones" });

        var field = new AuthorMetadataField(
            categoryId, request.InternalName.Trim(), request.Label.Trim(),
            fieldType, obligatoriness, request.IsRepeatable, request.IsHidden,
            request.SortOrder, request.HelpText);

        if (fieldType == FieldType.Select && !string.IsNullOrWhiteSpace(request.OptionsPipe))
        {
            var options = request.OptionsPipe
                .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            foreach (var (value, index) in options.Select((v, i) => (v, i)))
                field.Options.Add(new AuthorMetadataFieldOption(field.Id, value, value, false, index));
        }

        _context.AuthorMetadataFields.Add(field);
        await _context.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetFieldById), new { id = field.Id }, new { id = field.Id });
    }

    [HttpGet("fields/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetFieldById(Guid id, CancellationToken ct)
    {
        var field = await _context.AuthorMetadataFields
            .Include(f => f.Options)
            .FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field == null)
            return NotFound(new { message = "Campo no encontrado" });

        return Ok(AuthorMetadataFieldDto.FromEntity(field));
    }

    [HttpPut("fields/{id:guid}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> UpdateField(Guid id, [FromBody] UpdateAuthorFieldRequest request, CancellationToken ct)
    {
        var field = await _context.AuthorMetadataFields
            .FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field == null)
            return NotFound(new { message = "Campo no encontrado" });

        if (string.IsNullOrWhiteSpace(request.Label))
            return BadRequest(new { message = "Label es obligatorio" });

        if (!Enum.TryParse<ObligatorinessLevel>(request.Obligatoriness, ignoreCase: true, out var obligatoriness))
            return BadRequest(new { message = "Obligatoriness inválido" });

        FieldType? fieldType = null;
        if (request.FieldType is not null)
        {
            if (!Enum.TryParse<FieldType>(request.FieldType, ignoreCase: true, out var parsed))
                return BadRequest(new { message = "FieldType inválido" });
            fieldType = parsed;
        }

        field.Update(
            request.Label.Trim(), request.IsRequired, obligatoriness, request.SortOrder,
            request.IsHidden, request.HelpText, fieldType, request.IsRepeatable,
            string.IsNullOrWhiteSpace(request.InternalName) ? null : request.InternalName.Trim());

        await _context.SaveChangesAsync(ct);
        return Ok(new { message = "Campo actualizado." });
    }

    [HttpDelete("fields/{id:guid}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> DeleteField(Guid id, CancellationToken ct)
    {
        var field = await _context.AuthorMetadataFields
            .FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field == null)
            return NotFound(new { message = "Campo no encontrado" });

        var hasValues = await _context.UserAuthorMetadataValues
            .AnyAsync(v => v.AuthorMetadataFieldId == id, ct);
        if (hasValues)
            return BadRequest(new { message = "El campo tiene valores cargados por usuarios; primero ocultalo o contactá al administrador para purgarlos." });

        _context.AuthorMetadataFields.Remove(field);
        await _context.SaveChangesAsync(ct);
        return Ok(new { message = "Campo eliminado." });
    }

    [HttpPut("fields/{id:guid}/options")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> UpdateOptions(Guid id, [FromBody] UpdateAuthorFieldOptionsRequest request, CancellationToken ct)
    {
        var field = await _context.AuthorMetadataFields
            .Include(f => f.Options)
            .FirstOrDefaultAsync(f => f.Id == id, ct);
        if (field == null)
            return NotFound(new { message = "Campo no encontrado" });

        _context.AuthorMetadataFieldOptions.RemoveRange(field.Options);

        var index = 0;
        foreach (var option in request.Options)
        {
            if (string.IsNullOrWhiteSpace(option.Value)) continue;
            _context.AuthorMetadataFieldOptions.Add(new AuthorMetadataFieldOption(
                field.Id, option.Value, option.Label ?? option.Value, option.IsDefault, index++));
        }

        await _context.SaveChangesAsync(ct);
        return Ok(new { message = "Opciones actualizadas." });
    }

    /// <summary>Valores de metadatos de autor de un usuario (staff).</summary>
    [HttpGet("users/{userId:guid}/values")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> GetUserValues(Guid userId, CancellationToken ct)
    {
        var result = await GetUserAuthorMetadataInternalAsync(userId, ct);
        return result;
    }

    [HttpPut("users/{userId:guid}/values")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> UpdateUserValues(Guid userId, [FromBody] SaveAuthorMetadataRequest request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        try
        {
            var writer = HttpContext.RequestServices.GetRequiredService<GuIA.Application.UseCases.AuthorMetadata.AuthorMetadataWriter>();
            await writer.SaveAsync(userId, user.AccessCategoryId,
                (request.Values ?? []).Select(v => new GuIA.Application.UseCases.AuthorMetadata.AuthorMetadataInput(v.FieldId, v.Value ?? string.Empty, v.RepeatIndex)).ToList(),
                ct);
            return Ok(new { message = "Metadatos de autor actualizados." });
        }
        catch (InvalidOperationException ex)
        {
            const string prefix = "METADATA_FIELD:";
            if (ex.Message.StartsWith(prefix))
                return BadRequest("METADATA_FIELD", ex.Message[prefix.Length..].Trim());
            return BadRequest("USER_ERROR", ex.Message);
        }
    }

    private async Task<IActionResult> GetUserAuthorMetadataInternalAsync(Guid userId, CancellationToken ct)
    {
        var user = await _context.Users
            .Include(u => u.AuthorMetadataValues)
            .Include(u => u.AccessCategory)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        var fields = user.AccessCategoryId.HasValue
            ? await _context.AuthorMetadataFields
                .Include(f => f.Options)
                .Where(f => f.AccessCategoryId == user.AccessCategoryId.Value)
                .OrderBy(f => f.SortOrder)
                .ToListAsync(ct)
            : new List<AuthorMetadataField>();

        var valuesByField = user.AuthorMetadataValues
            .GroupBy(v => v.AuthorMetadataFieldId)
            .ToDictionary(g => g.Key, g => g.OrderBy(v => v.RepeatIndex).ToList());

        var items = fields.Select(f => new UserAuthorMetadataDto
        {
            FieldId = f.Id,
            InternalName = f.InternalName,
            Label = f.Label,
            FieldType = f.FieldType.ToString(),
            Obligatoriness = f.Obligatoriness.ToString(),
            IsRepeatable = f.IsRepeatable,
            HelpText = f.HelpText,
            Options = f.Options.OrderBy(o => o.SortOrder).Select(o => new AuthorFieldOptionDto
            {
                Id = o.Id,
                Value = o.Value,
                Label = o.Label,
                IsDefault = o.IsDefault,
                SortOrder = o.SortOrder
            }).ToList(),
            Values = valuesByField.TryGetValue(f.Id, out var vals)
                ? vals.Select(v => v.Value).ToList()
                : new List<string>()
        }).ToList();

        return Ok(new
        {
            userId = user.Id,
            fullName = user.FullName,
            email = user.Email?.Value,
            categoryId = user.AccessCategoryId,
            categoryName = user.AccessCategory?.Name,
            authorizesPublication = user.AuthorizesPublication,
            dataConsentAt = user.DataConsentAt,
            dataConsentText = user.DataConsentText,
            fields = items
        });
    }
}

public sealed record UpdateConsentRequest(string ConsentText);
public sealed record CreateAuthorFieldRequest(
    string InternalName, string Label, string FieldType, string Obligatoriness,
    bool IsRepeatable, bool IsHidden, int SortOrder, string? HelpText, string? OptionsPipe = null);
public sealed record UpdateAuthorFieldRequest(
    string? InternalName, string Label, string? FieldType, string Obligatoriness,
    bool IsRepeatable, bool IsHidden, int SortOrder, string? HelpText, bool IsRequired);
public sealed record UpdateAuthorFieldOptionsRequest(List<AuthorFieldOptionInput> Options);
public sealed record AuthorFieldOptionInput(string Value, string? Label, bool IsDefault, int SortOrder);
public sealed record SaveAuthorMetadataRequest(List<AuthorMetadataValueInput>? Values, bool? AuthorizesPublication = null);
public sealed record AuthorMetadataValueInput(Guid FieldId, string? Value, int RepeatIndex);

public sealed class AuthorFieldOptionDto
{
    public Guid Id { get; set; }
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }
}

public class AuthorMetadataFieldDto
{
    public Guid Id { get; set; }
    public Guid AccessCategoryId { get; set; }
    public string InternalName { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public string Obligatoriness { get; set; } = string.Empty;
    public bool IsRepeatable { get; set; }
    public bool IsHidden { get; set; }
    public int SortOrder { get; set; }
    public string? HelpText { get; set; }
    public List<AuthorFieldOptionDto> Options { get; set; } = new();

    public static AuthorMetadataFieldDto FromEntity(AuthorMetadataField f) => new()
    {
        Id = f.Id,
        AccessCategoryId = f.AccessCategoryId,
        InternalName = f.InternalName,
        Label = f.Label,
        FieldType = f.FieldType.ToString(),
        Obligatoriness = f.Obligatoriness.ToString(),
        IsRepeatable = f.IsRepeatable,
        IsHidden = f.IsHidden,
        SortOrder = f.SortOrder,
        HelpText = f.HelpText,
        Options = f.Options.OrderBy(o => o.SortOrder).Select(o => new AuthorFieldOptionDto
        {
            Id = o.Id,
            Value = o.Value,
            Label = o.Label,
            IsDefault = o.IsDefault,
            SortOrder = o.SortOrder
        }).ToList()
    };
}

public sealed class AuthorMetadataFieldAdminDto : AuthorMetadataFieldDto
{
    public string? CategoryName { get; set; }
}

public sealed class UserAuthorMetadataDto
{
    public Guid FieldId { get; set; }
    public string InternalName { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public string Obligatoriness { get; set; } = string.Empty;
    public bool IsRepeatable { get; set; }
    public string? HelpText { get; set; }
    public List<AuthorFieldOptionDto> Options { get; set; } = new();
    public List<string> Values { get; set; } = new();
}
