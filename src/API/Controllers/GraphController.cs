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

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var tags = tag.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => t.ToLowerInvariant())
                .ToList();
            query = query.Where(d => d.Keywords.Any(k => tags.Contains(k.Value.ToLower())));
        }

        if (!string.IsNullOrWhiteSpace(author))
        {
            var authors = author.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(a => a.ToLowerInvariant())
                .ToList();
            query = query.Where(d => d.Authors.Any(a => authors.Any(au => a.Name.ToLower().Contains(au))));
        }

        var documents = await query
            .Take(50)
            .ToListAsync(ct);

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
