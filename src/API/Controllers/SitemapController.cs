using GuIA.Application.Common;
using GuIA.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

[ApiController]
[Route("")]
public sealed class SitemapController : ControllerBase
{
    [HttpGet("sitemap.xml")]
    public async Task<IActionResult> GetSitemap(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var docs = await context.Documents
            .Where(d => d.Status == DocumentStatus.Published && d.DeletedAt == null)
            .Select(d => new { d.Id, d.UpdatedAt })
            .ToListAsync(ct);

        var config = await context.SiteConfigs.FirstOrDefaultAsync(ct);
        var baseUrl = (config?.BaseUrl ?? "http://localhost:5173").TrimEnd('/');

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

        sb.AppendLine("  <url>");
        sb.AppendLine($"    <loc>{baseUrl}/</loc>");
        sb.AppendLine("    <changefreq>daily</changefreq>");
        sb.AppendLine("    <priority>1.0</priority>");
        sb.AppendLine("  </url>");

        foreach (var doc in docs)
        {
            var lastmod = doc.UpdatedAt?.ToString("yyyy-MM-dd") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{baseUrl}/api/crawl/documents/{doc.Id}</loc>");
            sb.AppendLine($"    <lastmod>{lastmod}</lastmod>");
            sb.AppendLine("    <changefreq>weekly</changefreq>");
            sb.AppendLine("    <priority>0.8</priority>");
            sb.AppendLine("  </url>");
        }

        sb.AppendLine("</urlset>");
        return Content(sb.ToString(), "application/xml");
    }
}
