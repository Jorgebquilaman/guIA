using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Collections;

public record UpdateCollectionCommand(Guid Id, string Name, string? Description, bool IsPublic) : IRequest;

public class UpdateCollectionCommandHandler : IRequestHandler<UpdateCollectionCommand>
{
    private readonly IAppDbContext _context;

    public UpdateCollectionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateCollectionCommand request, CancellationToken ct)
    {
        var collection = await _context.Collections
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Collection {request.Id} not found.");

        collection.SetName(request.Name);
        collection.SetDescription(request.Description);
        collection.SetVisibility(request.IsPublic);
        collection.MarkAsUpdated();

        await _context.SaveChangesAsync(ct);
    }
}
