using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record PublishDocumentCommand(Guid DocumentId) : IRequest;

public class PublishDocumentCommandHandler : IRequestHandler<PublishDocumentCommand>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public PublishDocumentCommandHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(PublishDocumentCommand request, CancellationToken ct)
    {
        if (_currentUser.UserRole != "Admin")
            throw new UnauthorizedAccessException("Only administrators can publish documents.");

        var document = await _context.Documents
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Document {request.DocumentId} not found.");

        document.Publish(DateTime.UtcNow);
        await _context.SaveChangesAsync(ct);
    }
}
