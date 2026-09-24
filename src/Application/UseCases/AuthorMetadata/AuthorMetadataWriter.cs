using GuIA.Application.Common;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.AuthorMetadata;

public record AuthorMetadataInput(Guid FieldId, string Value, int RepeatIndex);

/// <summary>
/// Reemplaza los valores de metadatos de autor de un usuario, validando
/// que los campos pertenezcan a su categoría y que los obligatorios estén completos.
/// </summary>
public class AuthorMetadataWriter
{
    private readonly IAppDbContext _context;

    public AuthorMetadataWriter(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AuthorMetadataField>> SaveAsync(
        Guid userId,
        Guid? categoryId,
        List<AuthorMetadataInput> inputs,
        CancellationToken ct)
    {
        var fields = await _context.AuthorMetadataFields
            .Include(f => f.Options)
            .Where(f => categoryId != null && f.AccessCategoryId == categoryId)
            .ToListAsync(ct);

        var fieldsById = fields.ToDictionary(f => f.Id);

        foreach (var input in inputs)
        {
            if (!fieldsById.TryGetValue(input.FieldId, out var field))
                throw new InvalidOperationException($"METADATA_FIELD: El campo {input.FieldId} no pertenece a la categoría seleccionada.");

            if ((field.FieldType == FieldType.Select || field.FieldType == FieldType.MultiText)
                && field.Options.Any()
                && !string.IsNullOrWhiteSpace(input.Value))
            {
                var validValues = field.Options.Select(o => o.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
                foreach (var part in input.Value.Split(" ; "))
                {
                    if (!string.IsNullOrWhiteSpace(part) && !validValues.Contains(part.Trim()))
                        throw new InvalidOperationException($"METADATA_FIELD: '{part}' no es una opción válida para '{field.Label}'.");
                }
            }
        }

        var missing = fields
            .Where(f => f.IsRequired && !inputs.Any(i => i.FieldId == f.Id && !string.IsNullOrWhiteSpace(i.Value)))
            .Select(f => f.Label)
            .ToList();
        if (missing.Count > 0)
            throw new InvalidOperationException($"METADATA_FIELD: Campos obligatorios sin completar: {string.Join(", ", missing)}");

        var existing = await _context.UserAuthorMetadataValues
            .Where(v => v.UserId == userId)
            .ToListAsync(ct);
        _context.UserAuthorMetadataValues.RemoveRange(existing);

        foreach (var input in inputs)
        {
            if (string.IsNullOrWhiteSpace(input.Value)) continue;
            _context.UserAuthorMetadataValues.Add(new UserAuthorMetadataValue(
                userId, input.FieldId, input.Value.Trim(), Math.Max(0, input.RepeatIndex)));
        }

        await _context.SaveChangesAsync(ct);
        return fields;
    }
}
