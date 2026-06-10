using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record GetDocumentThumbnailQuery(Guid DocumentId) : IRequest<FileResponse?>;

public class GetDocumentThumbnailQueryHandler : IRequestHandler<GetDocumentThumbnailQuery, FileResponse?>
{
    private readonly IAppDbContext _context;
    private readonly IFileStoragePort _fileStorage;

    public GetDocumentThumbnailQueryHandler(IAppDbContext context, IFileStoragePort fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<FileResponse?> Handle(GetDocumentThumbnailQuery request, CancellationToken ct)
    {
        var document = await _context.Documents
            .Include(d => d.Files)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct);

        if (document == null)
            return null;

        // Prefer cover image, then fall back to file thumbnails
        if (document.CoverImagePath != null)
        {
            try
            {
                Stream content = await _fileStorage.GetAsync(document.CoverImagePath, ct);
                return new FileResponse(content, document.CoverImageMimeType ?? "image/jpeg", "cover.jpg");
            }
            catch { /* fall through */ }
        }

        var file = document.Files.FirstOrDefault(f => f.ThumbnailPath != null);
        if (file?.ThumbnailPath == null)
            return null;

        try
        {
            Stream content = await _fileStorage.GetAsync(file.ThumbnailPath, ct);
            return new FileResponse(content, "image/jpeg", $"thumb_{file.Id:N}.jpg");
        }
        catch
        {
            return null;
        }
    }
}
