using GuIA.Application.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

public sealed class GraphController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetGraph(
        [FromQuery] string? tag,
        [FromQuery] string? author,
        CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var query = context.Documents
            .Include(d => d.Authors)
            .Include(d => d.Keywords)
            .Where(d => d.DeletedAt == null && d.Status == Domain.Enums.DocumentStatus.Published);

        bool hasTagFilter = !string.IsNullOrWhiteSpace(tag);
        bool hasAuthorFilter = !string.IsNullOrWhiteSpace(author);

        List<Domain.Entities.Document> documents;

        if (hasTagFilter || hasAuthorFilter)
        {
            // El repositorio publicado es acotado: traemos un lote y filtramos parcial en memoria
            var candidates = await query
                .OrderByDescending(d => d.PublishedAt)
                .Take(200)
                .ToListAsync(ct);

            documents = candidates
                .Where(d =>
                {
                    bool tagMatch = false, authorMatch = false;
                    if (hasTagFilter)
                    {
                        var tags = tag.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(t => t.ToLowerInvariant())
                            .ToList();
                        // Match parcial case-insensitive: "teatro" encuentra "Teatro Patagónico"
                        tagMatch = d.Keywords.Any(k => tags.Any(t => k.Value.ToLower().Contains(t)));
                    }
                    if (hasAuthorFilter)
                    {
                        var authors = author.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(a => a.ToLowerInvariant())
                            .ToList();
                        authorMatch = d.Authors.Any(a => authors.Any(au => a.Name.ToLower().Contains(au)));
                    }
                    // Con ambos filtros acumulados: UNIÓN (OR) para que la red crezca
                    return tagMatch || authorMatch;
                })
                .Take(50)
                .ToList();
        }
        else
        {
            documents = await query
                .OrderByDescending(d => d.PublishedAt)
                .Take(50)
                .ToListAsync(ct);
        }

        var nodes = new List<object>();
        var edges = new List<object>();
        var addedNodeIds = new HashSet<string>();

        foreach (var doc in documents)
        {
            var docId = $"doc-{doc.Id}";
            if (addedNodeIds.Add(docId))
            {
                nodes.Add(new
                {
                    id = docId,
                    label = doc.Title.Length > 50 ? doc.Title[..47] + "..." : doc.Title,
                    type = "document",
                    documentId = doc.Id
                });
            }

            foreach (var authorEntry in doc.Authors)
            {
                var authorId = $"author-{authorEntry.Id}";
                if (addedNodeIds.Add(authorId))
                {
                    nodes.Add(new
                    {
                        id = authorId,
                        label = authorEntry.Name,
                        type = "author"
                    });
                }
                edges.Add(new { source = docId, target = authorId, type = "author" });
            }

            foreach (var kw in doc.Keywords)
            {
                var kwId = $"tag-{kw.Value.ToLowerInvariant()}";
                if (addedNodeIds.Add(kwId))
                {
                    nodes.Add(new
                    {
                        id = kwId,
                        label = kw.Value,
                        type = "tag"
                    });
                }
                edges.Add(new { source = docId, target = kwId, type = "keyword" });
            }
        }

        return Ok(new { nodes, edges, totalDocuments = documents.Count });
    }
}
