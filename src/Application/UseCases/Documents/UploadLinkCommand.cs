using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record UploadLinkCommand(
    string SourceUrl,
    string Title,
    Guid CollectionId,
    bool IsPublic,
    string? Description = null,
    string? DegreeProgram = null,
    string? Department = null,
    string? AdvisorName = null,
    string? Institution = null,
    string? License = null
) : IRequest<Guid>;

public class UploadLinkCommandHandler : IRequestHandler<UploadLinkCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailPort _email;

    public UploadLinkCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUser,
        IEmailPort email)
    {
        _context = context;
        _currentUser = currentUser;
        _email = email;
    }

    public async Task<Guid> Handle(UploadLinkCommand request, CancellationToken ct)
    {
        if (request.CollectionId == Guid.Empty)
            throw new InvalidOperationException("Debe seleccionar una colección.");

        bool collectionExists = await _context.Collections
            .AnyAsync(c => c.Id == request.CollectionId && c.DeletedAt == null, ct);
        if (!collectionExists)
            throw new InvalidOperationException($"Collection with id {request.CollectionId} not found.");

        var document = new Document(request.Title, DocumentType.Link, request.CollectionId, _currentUser.UserId, request.IsPublic);
        document.SetSourceUrl(request.SourceUrl);
        document.SetDescription(request.Description);
        document.SetDegreeProgram(request.DegreeProgram);
        document.SetDepartment(request.Department);
        document.SetAdvisorName(request.AdvisorName);
        document.SetInstitution(request.Institution);
        document.SetLicense(request.License);

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(ct);

        if (!string.IsNullOrEmpty(_currentUser.UserEmail))
        {
            string subject = $"Recibimos tu enlace: {document.Title}";
            string body = $@"
                <div style='font-family:Inter,sans-serif;max-width:560px;margin:0 auto'>
                    <div style='background:#1B4D3E;padding:24px;border-radius:12px 12px 0 0'>
                        <h1 style='color:#fff;font-size:20px;margin:0;font-weight:700'>GuIA Documental</h1>
                    </div>
                    <div style='padding:32px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:0 0 12px 12px'>
                        <h2 style='color:#1B4D3E;font-size:18px;margin:0 0 12px'>Enlace recibido</h2>
                        <p style='color:#444;line-height:1.6;margin:0 0 8px'>Hola,</p>
                        <p style='color:#444;line-height:1.6;margin:0 0 8px'>
                            Recibimos tu enlace <strong>{document.Title}</strong> correctamente.
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

        return document.Id;
    }
}
