using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record DeleteDocumentCommand(Guid DocumentId) : IRequest;

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand>
{
    private readonly IAppDbContext _context;

    public DeleteDocumentCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteDocumentCommand request, CancellationToken ct)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Document {request.DocumentId} not found.");

        if (document.Status == Domain.Enums.DocumentStatus.Published)
            throw new InvalidOperationException("Cannot delete a published document.");

        document.Delete();
        await _context.SaveChangesAsync(ct);
    }
}
