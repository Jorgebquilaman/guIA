using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record UnpublishDocumentCommand(Guid DocumentId) : IRequest;

public class UnpublishDocumentCommandHandler : IRequestHandler<UnpublishDocumentCommand>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UnpublishDocumentCommandHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(UnpublishDocumentCommand request, CancellationToken ct)
    {
        if (_currentUser.UserRole != "Admin")
            throw new UnauthorizedAccessException("Only administrators can unpublish documents.");

        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Document {request.DocumentId} not found.");

        document.Unpublish();
        await _context.SaveChangesAsync(ct);
    }
}
