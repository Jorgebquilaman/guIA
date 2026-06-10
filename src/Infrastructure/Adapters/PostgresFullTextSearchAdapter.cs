using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Infrastructure.Adapters;

public class PostgresFullTextSearchAdapter : ISearchPort
{
    private readonly IAppDbContext _context;

    public PostgresFullTextSearchAdapter(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<SearchResult> SearchAsync(SearchQuery query, CancellationToken ct = default)
    {
        IQueryable<Document> dbQuery = BuildFilteredQuery(query);
        IQueryable<Guid> idsQuery = dbQuery.Select(d => d.Id);

        // Apply text search filter via ILIKE on title, description, abstract, keywords, authors
        if (!string.IsNullOrWhiteSpace(query.TextQuery))
        {
            var searchTerm = query.TextQuery.Trim();
            dbQuery = dbQuery.Where(d =>
                EF.Functions.ILike(d.Title, $"%{searchTerm}%") ||
                (d.Description != null && EF.Functions.ILike(d.Description, $"%{searchTerm}%")) ||
                (d.AbstractEs != null && EF.Functions.ILike(d.AbstractEs, $"%{searchTerm}%")) ||
                d.Keywords.Any(k => EF.Functions.ILike(k.Value, $"%{searchTerm}%")) ||
                d.Authors.Any(a => EF.Functions.ILike(a.Name, $"%{searchTerm}%"))
            );
        }

        var totalCount = await dbQuery.CountAsync(ct);

        var pagedIds = await dbQuery
            .OrderByDescending(d => d.UpdatedAt ?? d.CreatedAt)
            .Select(d => d.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return new SearchResult(pagedIds, totalCount, query.Page, query.PageSize);
    }

    private IQueryable<Document> BuildFilteredQuery(SearchQuery query)
    {
        IQueryable<Document> dbQuery = _context.Documents
            .Where(d => d.DeletedAt == null);

        if (query.PublicOnly)
            dbQuery = dbQuery.Where(d => d.Status == DocumentStatus.Published);

        if (query.CollectionId.HasValue)
        {
            var collectionIds = GetCollectionAndDescendants(query.CollectionId.Value);
            dbQuery = dbQuery.Where(d => collectionIds.Contains(d.CollectionId));
        }

        if (query.Type.HasValue)
            dbQuery = dbQuery.Where(d => d.Type == query.Type.Value);

        if (query.DateFrom.HasValue)
        {
            var from = DateTime.SpecifyKind(query.DateFrom.Value, DateTimeKind.Utc);
            dbQuery = dbQuery.Where(d => d.CreatedAt >= from);
        }

        if (query.DateTo.HasValue)
        {
            var to = DateTime.SpecifyKind(query.DateTo.Value, DateTimeKind.Utc);
            dbQuery = dbQuery.Where(d => d.CreatedAt <= to);
        }

        if (query.Keywords is { Count: > 0 })
        {
            dbQuery = dbQuery.Where(d => d.Keywords.Any(k => query.Keywords.Contains(k.Value)));
        }

        if (!string.IsNullOrWhiteSpace(query.Author))
        {
            var authorName = query.Author.Trim();
            dbQuery = dbQuery.Where(d => d.Authors.Any(a => EF.Functions.ILike(a.Name, $"%{authorName}%")));
        }

        if (!string.IsNullOrWhiteSpace(query.DegreeProgram))
        {
            var degProg = query.DegreeProgram.Trim();
            dbQuery = dbQuery.Where(d => EF.Functions.ILike(d.DegreeProgram ?? "", $"%{degProg}%"));
        }

        if (query.Year.HasValue)
        {
            var year = query.Year.Value;
            dbQuery = dbQuery.Where(d => d.PublishedAt.HasValue && d.PublishedAt.Value.Year == year);
        }

        if (!string.IsNullOrWhiteSpace(query.Department))
        {
            var deptName = query.Department.Trim();
            dbQuery = dbQuery.Where(d => EF.Functions.ILike(d.Department ?? "", $"%{deptName}%"));
        }

        return dbQuery;
    }

    private List<Guid> GetCollectionAndDescendants(Guid rootId)
    {
        var allIds = new List<Guid> { rootId };
        var queue = new Queue<Guid>();
        queue.Enqueue(rootId);

        var childrenLookup = _context.Collections
            .Where(c => c.DeletedAt == null && c.ParentCollectionId.HasValue)
            .GroupBy(c => c.ParentCollectionId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(c => c.Id).ToList());

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (childrenLookup.TryGetValue(current, out var children))
            {
                allIds.AddRange(children);
                foreach (var child in children)
                    queue.Enqueue(child);
            }
        }

        return allIds;
    }
}
