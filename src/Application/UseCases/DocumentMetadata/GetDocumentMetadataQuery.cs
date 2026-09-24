using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.DocumentMetadata;

public record GetDocumentMetadataQuery(Guid DocumentId) : IRequest<List<DocumentMetadataValueDto>>;

public class GetDocumentMetadataQueryHandler : IRequestHandler<GetDocumentMetadataQuery, List<DocumentMetadataValueDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetDocumentMetadataQueryHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<DocumentMetadataValueDto>> Handle(GetDocumentMetadataQuery request, CancellationToken ct)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct);

        if (document == null || !DocumentVisibility.CanView(document, _currentUser))
            throw new GuIA.Domain.Exceptions.DocumentNotFoundException(request.DocumentId);

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
