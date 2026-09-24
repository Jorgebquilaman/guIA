using GuIA.Application.Common;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using MediatR;

namespace GuIA.Application.UseCases.MetadataFields;

public record CreateMetadataFieldCommand(
    Guid SchemaId,
    string DublinCoreElement,
    string? Qualifier,
    string InternalName,
    string Label,
    string FieldType,
    string Obligatoriness,
    bool IsRepeatable,
    bool IsReadOnly,
    bool IsHidden,
    bool IsSimpleView,
    int SortOrder,
    string? HelpText,
    string? AiPrompt = null,
    string? OptionsPipe = null
) : IRequest<Guid>;

public class CreateMetadataFieldCommandHandler : IRequestHandler<CreateMetadataFieldCommand, Guid>
{
    private readonly IAppDbContext _context;

    public CreateMetadataFieldCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateMetadataFieldCommand request, CancellationToken ct)
    {
        var schema = await _context.MetadataSchemas.FindAsync(new object[] { request.SchemaId }, ct);
        if (schema == null)
            throw new KeyNotFoundException($"Schema {request.SchemaId} not found.");

        if (!Enum.TryParse<FieldType>(request.FieldType, true, out var fieldType))
            throw new ArgumentException($"Invalid field type: {request.FieldType}");

        if (!Enum.TryParse<ObligatorinessLevel>(request.Obligatoriness, true, out var obligatoriness))
            throw new ArgumentException($"Invalid obligatoriness: {request.Obligatoriness}");

        var field = new MetadataField(
            request.SchemaId,
            request.DublinCoreElement,
            request.Qualifier,
            request.InternalName,
            request.Label,
            fieldType,
            obligatoriness,
            request.IsRepeatable,
            request.IsReadOnly,
            request.IsHidden,
            request.IsSimpleView,
            request.SortOrder,
            request.HelpText,
            request.AiPrompt);

        _context.MetadataFields.Add(field);
        await _context.SaveChangesAsync(ct);

        if (fieldType == FieldType.Select && !string.IsNullOrWhiteSpace(request.OptionsPipe))
        {
            var values = request.OptionsPipe
                .Split('|', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Distinct()
                .ToList();

            for (var i = 0; i < values.Count; i++)
                _context.MetadataFieldOptions.Add(new MetadataFieldOption(field.Id, values[i], values[i], false, i));

            await _context.SaveChangesAsync(ct);
        }

        return field.Id;
    }
}
