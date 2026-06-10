using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Collections;

public record GetCollectionTreeQuery : IRequest<List<CollectionDto>>;

public class GetCollectionTreeQueryHandler : IRequestHandler<GetCollectionTreeQuery, List<CollectionDto>>
{
    private readonly IAppDbContext _context;

    public GetCollectionTreeQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CollectionDto>> Handle(GetCollectionTreeQuery request, CancellationToken ct)
    {
        var collections = await _context.Collections
            .Where(c => c.DeletedAt == null)
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
            .ToListAsync(ct);

        var allDtos = collections.Select(c => new CollectionDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            ParentCollectionId = c.ParentCollectionId,
            IsPublic = c.IsPublic,
            DocumentCount = c.DocumentCount,
            CreatedAt = c.CreatedAt
        }).ToList();

        var lookup = allDtos.ToLookup(dto => dto.ParentCollectionId);

        foreach (var dto in allDtos)
        {
            dto.SubCollections = lookup[dto.Id].ToList();
        }

        return lookup[null].ToList();
    }
}
