using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record GetDocumentDownloadQuery(Guid DocumentId, Guid FileId, string? IpAddress = null, string? Country = null) : IRequest<FileResponse>;

public class GetDocumentDownloadQueryHandler : IRequestHandler<GetDocumentDownloadQuery, FileResponse>
{
    private readonly IAppDbContext _context;
    private readonly IFileStoragePort _fileStorage;

    public GetDocumentDownloadQueryHandler(IAppDbContext context, IFileStoragePort fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<FileResponse> Handle(GetDocumentDownloadQuery request, CancellationToken ct)
    {
        var document = await _context.Documents
            .Include(d => d.Files)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Document {request.DocumentId} not found.");

        var file = document.Files.FirstOrDefault(f => f.Id == request.FileId)
            ?? throw new InvalidOperationException($"File {request.FileId} not found in document.");

        Stream content = await _fileStorage.GetAsync(file.StoredPath, ct);

        _context.AccessLogs.Add(new AccessLog(
            AccessAction.Download,
            document.Id,
            ipAddress: request.IpAddress,
            country: request.Country));

        await _context.SaveChangesAsync(ct);

        return new FileResponse(content, file.MimeType, file.OriginalFileName);
    }
}
