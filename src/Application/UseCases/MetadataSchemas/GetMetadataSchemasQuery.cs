using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.MetadataSchemas;

public record GetMetadataSchemasQuery : IRequest<List<MetadataSchemaDto>>;

public class GetMetadataSchemasQueryHandler : IRequestHandler<GetMetadataSchemasQuery, List<MetadataSchemaDto>>
{
    private readonly IAppDbContext _context;

    public GetMetadataSchemasQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<MetadataSchemaDto>> Handle(GetMetadataSchemasQuery request, CancellationToken ct)
    {
        return await _context.MetadataSchemas
            .Where(s => s.IsActive)
            .Include(s => s.Fields.OrderBy(f => f.SortOrder))
                .ThenInclude(f => f.Options.OrderBy(o => o.SortOrder))
            .OrderBy(s => s.SortOrder)
            .Select(s => new MetadataSchemaDto
            {
                Id = s.Id,
                DocumentTypeName = s.DocumentTypeName,
                Label = s.Label,
                IsActive = s.IsActive,
                SortOrder = s.SortOrder,
                Fields = s.Fields.Select(f => new MetadataFieldDto
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
            })
            .ToListAsync(ct);
    }
}
