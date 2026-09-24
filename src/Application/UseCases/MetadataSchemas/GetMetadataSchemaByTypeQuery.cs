using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.MetadataSchemas;

public record GetMetadataSchemaByTypeQuery(string DocumentTypeName) : IRequest<MetadataSchemaDto?>;

public class GetMetadataSchemaByTypeQueryHandler : IRequestHandler<GetMetadataSchemaByTypeQuery, MetadataSchemaDto?>
{
    private readonly IAppDbContext _context;

    public GetMetadataSchemaByTypeQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<MetadataSchemaDto?> Handle(GetMetadataSchemaByTypeQuery request, CancellationToken ct)
    {
        var query = _context.MetadataSchemas
            .Include(s => s.Fields.OrderBy(f => f.SortOrder))
                .ThenInclude(f => f.Options.OrderBy(o => o.SortOrder));

        // Try direct match by DocumentTypeName first
        var schema = await query
            .Where(s => s.DocumentTypeName == request.DocumentTypeName && s.IsActive)
            .FirstOrDefaultAsync(ct);

        // Fallback: resolve schema through DocumentTypeDef.MetadataSchemaId FK
        if (schema == null)
        {
            var schemaId = await _context.DocumentTypeDefs
                .Where(t => t.Name == request.DocumentTypeName && t.MetadataSchemaId != null)
                .Select(t => t.MetadataSchemaId!.Value)
                .FirstOrDefaultAsync(ct);

            if (schemaId != default)
            {
                schema = await query
                    .Where(s => s.Id == schemaId && s.IsActive)
                    .FirstOrDefaultAsync(ct);
            }
        }

        if (schema == null) return null;

        return new MetadataSchemaDto
        {
            Id = schema.Id,
            DocumentTypeName = schema.DocumentTypeName,
            Label = schema.Label,
            IsActive = schema.IsActive,
            SortOrder = schema.SortOrder,
            Fields = schema.Fields.Select(f => new MetadataFieldDto
            {
                Id = f.Id,
                MetadataSchemaId = f.MetadataSchemaId,
                DublinCoreElement = f.DublinCoreElement,
                Qualifier = f.Qualifier,
                InternalName = f.InternalName,
                Label = f.Label,
                FieldType = f.FieldType.ToString(),
                IsRequired = f.IsRequired,
                Obligatoriness = f.Obligatoriness.ToString(),
                IsRepeatable = f.IsRepeatable,
                IsReadOnly = f.IsReadOnly,
                IsHidden = f.IsHidden,
                IsSimpleView = f.IsSimpleView,
                SortOrder = f.SortOrder,
                HelpText = f.HelpText,
                AiPrompt = f.AiPrompt,
                Options = f.Options.Select(o => new MetadataFieldOptionDto
                {
                    Id = o.Id,
                    MetadataFieldId = o.MetadataFieldId,
                    Value = o.Value,
                    Label = o.Label,
                    IsDefault = o.IsDefault,
                    SortOrder = o.SortOrder
                }).ToList()
            }).ToList()
        };
    }
}
