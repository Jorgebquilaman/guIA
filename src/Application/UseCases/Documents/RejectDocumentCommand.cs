using GuIA.Application.Common;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record RejectDocumentCommand(Guid DocumentId, string Reason) : IRequest;

public class RejectDocumentCommandHandler : IRequestHandler<RejectDocumentCommand>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RejectDocumentCommandHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(RejectDocumentCommand request, CancellationToken ct)
    {
        if (_currentUser.UserRole != "Admin")
            throw new UnauthorizedAccessException("Only administrators can reject documents.");

        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Document {request.DocumentId} not found.");

        document.Reject();
        document.MarkAsUpdated();

        _context.AccessLogs.Add(new Domain.Entities.AccessLog(
            Domain.Enums.AccessAction.View,
            document.Id,
            _currentUser.UserId));

        await _context.SaveChangesAsync(ct);
    }
}
