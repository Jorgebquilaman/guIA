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
        var schema = await _context.MetadataSchemas
            .Where(s => s.DocumentTypeName == request.DocumentTypeName && s.IsActive)
            .Include(s => s.Fields.OrderBy(f => f.SortOrder))
                .ThenInclude(f => f.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(ct);

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
                SortOrder = f.SortOrder,
                HelpText = f.HelpText,
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
