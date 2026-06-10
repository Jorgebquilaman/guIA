using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Collections;

public record GetCollectionByIdQuery(Guid Id) : IRequest<CollectionDto>;

public class GetCollectionByIdQueryHandler : IRequestHandler<GetCollectionByIdQuery, CollectionDto>
{
    private readonly IAppDbContext _context;

    public GetCollectionByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<CollectionDto> Handle(GetCollectionByIdQuery request, CancellationToken ct)
    {
        var collection = await _context.Collections
            .Where(c => c.Id == request.Id && c.DeletedAt == null)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ParentCollectionId,
                c.IsPublic,
                c.CreatedAt,
                DocumentCount = c.Documents.Count(d => d.DeletedAt == null)
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException($"Collection {request.Id} not found.");

        var parent = collection.ParentCollectionId.HasValue
            ? await _context.Collections
                .Where(c => c.Id == collection.ParentCollectionId.Value && c.DeletedAt == null)
                .Select(c => new CollectionDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ParentCollectionId = c.ParentCollectionId,
                    IsPublic = c.IsPublic,
                    CreatedAt = c.CreatedAt
                })
                .FirstOrDefaultAsync(ct)
            : null;

        return new CollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            ParentCollectionId = collection.ParentCollectionId,
            IsPublic = collection.IsPublic,
            DocumentCount = collection.DocumentCount,
            CreatedAt = collection.CreatedAt,
            ParentCollection = parent
        };
    }
}