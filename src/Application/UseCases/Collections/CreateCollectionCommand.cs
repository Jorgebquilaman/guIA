using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Collections;

public record CreateCollectionCommand(
    string Name,
    string? Description,
    Guid? ParentCollectionId,
    bool IsPublic
) : IRequest<CollectionDto>;

public class CreateCollectionCommandHandler : IRequestHandler<CreateCollectionCommand, CollectionDto>
{
    private readonly IAppDbContext _context;

    public CreateCollectionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<CollectionDto> Handle(CreateCollectionCommand request, CancellationToken ct)
    {
        if (request.ParentCollectionId.HasValue)
        {
            bool parentExists = await _context.Collections
                .AnyAsync(c => c.Id == request.ParentCollectionId.Value && c.DeletedAt == null, ct);
            if (!parentExists)
                throw new InvalidOperationException($"Parent collection {request.ParentCollectionId} not found.");
        }

        var collection = new Collection(
            request.Name,
            request.IsPublic,
            request.Description,
            request.ParentCollectionId);

        _context.Collections.Add(collection);
        await _context.SaveChangesAsync(ct);

        return new CollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            ParentCollectionId = collection.ParentCollectionId,
            IsPublic = collection.IsPublic,
            DocumentCount = 0,
            CreatedAt = collection.CreatedAt
        };
    }
}
