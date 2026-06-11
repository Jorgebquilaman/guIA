using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading.Channels;

namespace GuIA.Application.UseCases.Documents;

public record UploadDocumentCommand(
    List<(Stream Content, string FileName, string MimeType)> Files,
    Guid CollectionId,
    string? Title,
    bool IsPublic,
    (Stream Content, string FileName, string MimeType)? CoverImage = null
) : IRequest<Guid>;

public class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IFileStoragePort _fileStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly ChannelWriter<Guid> _channelWriter;
    private readonly IEmailPort _email;

    public UploadDocumentCommandHandler(
        IAppDbContext context,
        IFileStoragePort fileStorage,
        ICurrentUserService currentUser,
        ChannelWriter<Guid> channelWriter,
        IEmailPort email)
    {
        _context = context;
        _fileStorage = fileStorage;
        _currentUser = currentUser;
        _channelWriter = channelWriter;
        _email = email;
    }

    public async Task<Guid> Handle(UploadDocumentCommand request, CancellationToken ct)
    {
        if (request.CollectionId == Guid.Empty)
            throw new InvalidOperationException("Debe seleccionar una colección.");

        bool collectionExists = await _context.Collections
            .AnyAsync(c => c.Id == request.CollectionId && c.DeletedAt == null, ct);
        if (!collectionExists)
            throw new InvalidOperationException($"Collection with id {request.CollectionId} not found.");

        string title = request.Title ?? Path.GetFileNameWithoutExtension(request.Files.First().FileName);
        string ext = Path.GetExtension(request.Files.First().FileName)?.ToLowerInvariant() ?? "";
        DocumentType docType = ext switch
        {
            ".pdf" => DocumentType.Article,
            ".doc" or ".docx" or ".odt" or ".rtf" => DocumentType.Article,
            ".csv" or ".xls" or ".xlsx" or ".ods" => DocumentType.Dataset,
            _ => DocumentType.Other
        };

        var document = new Document(title, docType, request.CollectionId, _currentUser.UserId, request.IsPublic);

        foreach (var (stream, fileName, mimeType) in request.Files)
        {
            var stored = await _fileStorage.SaveAsync(stream, fileName, mimeType, ct);
            var thumbPath = await _fileStorage.GenerateThumbnailAsync(stored.StoredPath, mimeType, ct);
            var docFile = new DocumentFile
            {
                Id = Guid.NewGuid(),
                StoredPath = stored.StoredPath,
                OriginalFileName = stored.OriginalFileName,
                MimeType = mimeType,
                SizeBytes = stored.SizeBytes,
                ThumbnailPath = thumbPath
            };
            document.AddFile(docFile);
        }

        if (request.CoverImage is var (coverStream, coverName, coverMime))
        {
            var stored = await _fileStorage.SaveAsync(coverStream, coverName, coverMime, ct);
            var thumbPath = await _fileStorage.GenerateThumbnailAsync(stored.StoredPath, coverMime, ct);
            document.SetCoverImage(thumbPath ?? stored.StoredPath, coverMime);
        }

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(ct);

        if (!string.IsNullOrEmpty(_currentUser.UserEmail))
        {
            string subject = $"Recibimos tu documento: {document.Title}";
            string body = $@"
                <div style='font-family:Inter,sans-serif;max-width:560px;margin:0 auto'>
                    <div style='background:#1B4D3E;padding:24px;border-radius:12px 12px 0 0'>
                        <h1 style='color:#fff;font-size:20px;margin:0;font-weight:700'>GuIA Documental</h1>
                    </div>
                    <div style='padding:32px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:0 0 12px 12px'>
                        <h2 style='color:#1B4D3E;font-size:18px;margin:0 0 12px'>Documento recibido</h2>
                        <p style='color:#444;line-height:1.6;margin:0 0 8px'>Hola,</p>
                        <p style='color:#444;line-height:1.6;margin:0 0 8px'>
                            Recibimos tu documento <strong>{document.Title}</strong> correctamente.
                        </p>
                        <p style='color:#444;line-height:1.6;margin:0 0 8px'>
                            El equipo de revisión evaluará el contenido y te notificaremos cuando esté disponible públicamente.
                        </p>
                        <p style='color:#666;font-size:13px;margin-top:24px'>
                            Saludos,<br/>Equipo GuIA Documental · IUPA
                        </p>
                    </div>
                </div>";

            try
            {
                await _email.SendAsync(_currentUser.UserEmail, subject, body, ct);
            }
            catch
            {
                // Email failure should not block upload
            }
        }

        await _channelWriter.WriteAsync(document.Id, ct);

        return document.Id;
    }
}
