using GuIA.Application.Common;
using GuIA.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace GuIA.API.Controllers;

[ApiController]
[Route("api/crawl")]
public sealed class CrawlController : ControllerBase
{
    [HttpGet("documents/{id:guid}")]
    public async Task<IActionResult> GetDocument(Guid id, CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var config = await context.SiteConfigs.FirstOrDefaultAsync(ct);
        var baseUrl = (config?.BaseUrl ?? "http://localhost:5173").TrimEnd('/');

        var doc = await context.Documents
            .Include(d => d.Collection)
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .Include(d => d.MetadataValues)
                .ThenInclude(mv => mv.Field)
            .FirstOrDefaultAsync(d => d.Id == id && d.Status == DocumentStatus.Published && d.DeletedAt == null, ct);

        if (doc == null)
            return NotFound();

        var primaryFile = doc.Files.FirstOrDefault();
        var pdfUrl = primaryFile?.OriginalFileName.EndsWith(".pdf") == true
            ? $"{baseUrl}/api/documents/{doc.Id}/download/{primaryFile.Id}"
            : null;

        var authorNames = doc.Authors
            .OrderBy(a => a.Order)
            .Select(a =>
            {
                var parts = a.Name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                return parts.Length > 1 ? $"{parts[^1]}, {string.Join(' ', parts[..^1])}" : a.Name;
            })
            .ToList();

        var pubDate = doc.PublicationDate?.ToString("yyyy-MM-dd")
            ?? doc.PublishedAt?.ToString("yyyy-MM-dd")
            ?? "";

        var abstractText = doc.AbstractEs ?? doc.Description ?? "";
        var language = "es";

        var dcMapping = new List<(string name, string value)>
        {
            ("dc.title", doc.Title),
            ("dc.creator", string.Join("; ", authorNames)),
        };
        if (!string.IsNullOrEmpty(doc.AdvisorName))
            dcMapping.Add(("dc.contributor.advisor", doc.AdvisorName));
        dcMapping.Add(("dc.publisher", doc.Institution ?? "IUPA"));
        if (!string.IsNullOrEmpty(pubDate))
            dcMapping.Add(("dc.date.issued", pubDate));
        dcMapping.Add(("dc.type", doc.Type.ToString()));
        if (!string.IsNullOrEmpty(abstractText))
            dcMapping.Add(("dc.description.abstract", abstractText));
        foreach (var kw in doc.Keywords)
            dcMapping.Add(("dc.subject", kw.Value));
        dcMapping.Add(("dc.rights.license", doc.License ?? "CC BY-NC-ND 4.0"));
        dcMapping.Add(("dc.identifier.uri", $"{baseUrl}/documentos/{doc.Id}"));
        dcMapping.Add(("dc.format", primaryFile?.MimeType ?? "application/pdf"));

        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"es\">");
        sb.AppendLine("<head>");
        sb.AppendLine($"<meta charset=\"UTF-8\">");
        sb.AppendLine($"<title>{System.Net.WebUtility.HtmlEncode(doc.Title)} — GuIA</title>");
        sb.AppendLine($"<link rel=\"canonical\" href=\"{baseUrl}/documentos/{doc.Id}\" />");

        // Google Scholar Highwire tags
        sb.AppendLine($"<meta name=\"citation_title\" content=\"{System.Net.WebUtility.HtmlEncode(doc.Title)}\">");
        foreach (var name in authorNames)
            sb.AppendLine($"<meta name=\"citation_author\" content=\"{System.Net.WebUtility.HtmlEncode(name)}\">");
        if (!string.IsNullOrEmpty(pubDate))
            sb.AppendLine($"<meta name=\"citation_publication_date\" content=\"{pubDate}\">");
        if (doc.Type == DocumentType.Article)
            sb.AppendLine($"<meta name=\"citation_journal_title\" content=\"{System.Net.WebUtility.HtmlEncode(doc.Collection?.Name ?? doc.Institution ?? "IUPA")}\">");
        if (doc.Type == DocumentType.Thesis && !string.IsNullOrEmpty(doc.Institution))
            sb.AppendLine($"<meta name=\"citation_dissertation_institution\" content=\"{System.Net.WebUtility.HtmlEncode(doc.Institution)}\">");
        if (pdfUrl != null)
            sb.AppendLine($"<meta name=\"citation_pdf_url\" content=\"{pdfUrl}\">");
        sb.AppendLine($"<meta name=\"citation_abstract_html_url\" content=\"{baseUrl}/documentos/{doc.Id}\">");
        sb.AppendLine($"<meta name=\"citation_institution\" content=\"{System.Net.WebUtility.HtmlEncode(doc.Institution ?? "IUPA")}\">");
        sb.AppendLine($"<meta name=\"citation_language\" content=\"{language}\">");
        var keywordValues = doc.Keywords.Select(k => k.Value).ToList();
        if (keywordValues.Count > 0)
            sb.AppendLine($"<meta name=\"citation_keywords\" content=\"{System.Net.WebUtility.HtmlEncode(string.Join("; ", keywordValues))}\">");

        // Dublin Core tags
        foreach (var (name, value) in dcMapping)
            sb.AppendLine($"<meta name=\"{name}\" content=\"{System.Net.WebUtility.HtmlEncode(value)}\">");

        // JSON-LD
        var jsonLd = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = true,
        };
        var jsonObj = new Dictionary<string, object?>
        {
            ["@context"] = "https://schema.org",
            ["@type"] = "ScholarlyArticle",
            ["headline"] = doc.Title,
            ["author"] = authorNames.Select(n => new Dictionary<string, string> { ["@type"] = "Person", ["name"] = n }).ToList(),
            ["datePublished"] = string.IsNullOrEmpty(pubDate) ? null : pubDate,
            ["publisher"] = new Dictionary<string, string> { ["@type"] = "Organization", ["name"] = doc.Institution ?? "IUPA" },
            ["inLanguage"] = language,
            ["license"] = "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            ["isAccessibleForFree"] = true,
        };
        if (!string.IsNullOrEmpty(doc.Description)) jsonObj["description"] = doc.Description;
        if (keywordValues.Count > 0) jsonObj["keywords"] = string.Join(", ", keywordValues);
        if (pdfUrl != null) jsonObj["url"] = pdfUrl;

        sb.AppendLine($"<script type=\"application/ld+json\">{System.Text.Json.JsonSerializer.Serialize(jsonObj, jsonLd)}</script>");

        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine($"<h1>{System.Net.WebUtility.HtmlEncode(doc.Title)}</h1>");
        if (!string.IsNullOrEmpty(abstractText))
            sb.AppendLine($"<p>{System.Net.WebUtility.HtmlEncode(abstractText)}</p>");
        sb.AppendLine($"<p>Autores: {string.Join("; ", authorNames.Select(System.Net.WebUtility.HtmlEncode))}</p>");
        if (!string.IsNullOrEmpty(pubDate))
            sb.AppendLine($"<p>Fecha de publicación: {pubDate}</p>");
        sb.AppendLine($"<p>URL: <a href=\"{baseUrl}/documentos/{doc.Id}\">{baseUrl}/documentos/{doc.Id}</a></p>");
        if (pdfUrl != null)
            sb.AppendLine($"<p><a href=\"{pdfUrl}\">Descargar PDF</a></p>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");

        return Content(sb.ToString(), "text/html", Encoding.UTF8);
    }
}
