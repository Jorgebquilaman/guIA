using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Collections;

public record DeleteCollectionCommand(Guid Id) : IRequest;

public class DeleteCollectionCommandHandler : IRequestHandler<DeleteCollectionCommand>
{
    private readonly IAppDbContext _context;

    public DeleteCollectionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteCollectionCommand request, CancellationToken ct)
    {
        var collection = await _context.Collections
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Collection {request.Id} not found.");

        collection.Delete();

        var subCollections = await _context.Collections
            .Where(c => c.ParentCollectionId == request.Id && c.DeletedAt == null)
            .ToListAsync(ct);

        foreach (var sub in subCollections)
            sub.Delete();

        await _context.SaveChangesAsync(ct);
    }
}
