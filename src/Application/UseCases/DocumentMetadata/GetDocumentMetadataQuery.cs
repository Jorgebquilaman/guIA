using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.DocumentMetadata;

public record GetDocumentMetadataQuery(Guid DocumentId) : IRequest<List<DocumentMetadataValueDto>>;

public class GetDocumentMetadataQueryHandler : IRequestHandler<GetDocumentMetadataQuery, List<DocumentMetadataValueDto>>
{
    private readonly IAppDbContext _context;

    public GetDocumentMetadataQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DocumentMetadataValueDto>> Handle(GetDocumentMetadataQuery request, CancellationToken ct)
    {
        return await _context.DocumentMetadataValues
            .Where(v => v.DocumentId == request.DocumentId)
            .OrderBy(v => v.RepeatIndex)
            .Select(v => new DocumentMetadataValueDto
            {
                Id = v.Id,
                DocumentId = v.DocumentId,
                MetadataFieldId = v.MetadataFieldId,
                Value = v.Value,
                RepeatIndex = v.RepeatIndex
            })
            .ToListAsync(ct);
    }
}
