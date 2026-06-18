using GuIA.Application.Common;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using GuIA.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

public sealed class StatsController : BaseApiController
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        int totalDocuments = await context.Documents.CountAsync(d => d.DeletedAt == null, ct);
        int draftCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Draft, ct);
        int publishedCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Published, ct);
        int processingCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Processing, ct);
        int rejectedCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Rejected, ct);
        int totalCollections = await context.Collections.CountAsync(c => c.DeletedAt == null, ct);
        int totalUsers = await context.Users.CountAsync(u => u.IsActive, ct);
        int totalDegreePrograms = await context.DegreePrograms.CountAsync(ct);
        int totalAuthors = await context.DocumentAuthors.CountAsync(ct);
        int totalDownloads = await context.AccessLogs.CountAsync(a => a.Action == AccessAction.Download, ct);

        var recentActivity = await context.AccessLogs
            .Where(a => a.OccurredAt >= DateTime.UtcNow.AddDays(-30))
            .GroupBy(a => a.OccurredAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Date)
            .Take(30)
            .ToListAsync(ct);

        return Ok(new
        {
            totalDocuments,
            draftCount,
            publishedCount,
            processingCount,
            rejectedCount,
            totalUsers,
            totalCollections,
            totalDegreePrograms,
            totalAuthors,
            totalDownloads,
            recentActivity
        });
    }

    [HttpGet("filters")]
    public async Task<IActionResult> GetFilters(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var publishedDocs = context.Documents.Where(d => d.DeletedAt == null && d.Status == DocumentStatus.Published);

        var types = await publishedDocs
            .Select(d => d.Type.ToString())
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync(ct);

        var authors = await context.DocumentAuthors
            .Where(da => da.Document != null && da.Document.DeletedAt == null && da.Document.Status == DocumentStatus.Published)
            .Select(da => da.Name)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync(ct);

        var degreePrograms = await publishedDocs
            .Where(d => d.DegreeProgram != null)
            .Select(d => d.DegreeProgram!)
            .Distinct()
            .OrderBy(dp => dp)
            .ToListAsync(ct);

        var years = await publishedDocs
            .Where(d => d.PublishedAt.HasValue)
            .Select(d => d.PublishedAt!.Value.Year)
            .Distinct()
            .OrderByDescending(y => y)
            .ToListAsync(ct);

        return Ok(new
        {
            types,
            authors,
            degreePrograms,
            years
        });
    }

    [HttpPost("visit")]
    public async Task<IActionResult> LogVisit([FromServices] IGeoIpService geoIp, CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var country = await geoIp.ResolveCountryAsync(ip, ct);

        context.AccessLogs.Add(new AccessLog(
            AccessAction.PageView,
            ipAddress: ip,
            country: country));

        await context.SaveChangesAsync(CancellationToken.None);

        return Ok(new { success = true });
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var departments = await context.Departments
            .Where(d => d.DeletedAt == null)
            .OrderBy(d => d.Name)
            .Select(d => new
            {
                id = d.Id,
                name = d.Name,
                color = d.Color,
                icon = d.Icon,
                degreePrograms = d.DegreePrograms
                    .Where(dp => dp.DeletedAt == null)
                    .OrderBy(dp => dp.Name)
                    .Select(dp => new { id = dp.Id, name = dp.Name })
                    .ToList()
            })
            .ToListAsync(ct);

        return Ok(departments);
    }

    [HttpGet("downloads")]
    public async Task<IActionResult> GetDownloadStats(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
        var downloadLogs = context.AccessLogs.Where(a => a.Action == AccessAction.Download);

        // ── Total downloads ──
        var totalDownloads = await downloadLogs.CountAsync(ct);

        // ── Downloads today, this week, this month ──
        var now = DateTime.UtcNow;
        var startOfToday = now.Date;
        var startOfWeek = now.AddDays(-(int)now.DayOfWeek).Date;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var downloadsToday = await downloadLogs.CountAsync(a => a.OccurredAt >= startOfToday, ct);
        var downloadsThisWeek = await downloadLogs.CountAsync(a => a.OccurredAt >= startOfWeek, ct);
        var downloadsThisMonth = await downloadLogs.CountAsync(a => a.OccurredAt >= startOfMonth, ct);

        // ── Downloads by day (last 90 days) ──
        var downloadsByDay = await downloadLogs
            .Where(a => a.OccurredAt >= now.AddDays(-90))
            .GroupBy(a => a.OccurredAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync(ct);

        // ── Downloads by month (all time) ──
        var downloadsByMonth = await downloadLogs
            .GroupBy(a => new { a.OccurredAt.Year, a.OccurredAt.Month })
            .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Count = g.Count() })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync(ct);

        // ── Top downloaded documents ──
        var topDocuments = await downloadLogs
            .Where(a => a.DocumentId != null)
            .GroupBy(a => a.DocumentId)
            .Select(g => new { DocumentId = g.Key, DownloadCount = g.Count() })
            .OrderByDescending(x => x.DownloadCount)
            .Take(20)
            .ToListAsync(ct);

        var docIds = topDocuments.Select(t => t.DocumentId!.Value).ToList();
        var documents = docIds.Count > 0
            ? await context.Documents
                .Where(d => docIds.Contains(d.Id))
                .Select(d => new { d.Id, d.Title, d.Type })
                .ToListAsync(ct)
            : [];

        var topDocumentsWithDetails = topDocuments
            .Join(documents, td => td.DocumentId, d => (Guid?)d.Id, (td, d) => new
            {
                documentId = d.Id,
                title = d.Title,
                type = d.Type.ToString(),
                downloads = td.DownloadCount
            })
            .OrderByDescending(x => x.downloads)
            .ToList();

        // ── Downloads by country ──
        var downloadsByCountry = await downloadLogs
            .Where(a => a.Country != null)
            .GroupBy(a => a.Country)
            .Select(g => new { Country = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Downloads by document type ──
        var downloadsByType = await downloadLogs
            .Where(a => a.DocumentId != null)
            .Join(context.Documents, log => log.DocumentId, doc => (Guid?)doc.Id, (log, doc) => doc)
            .GroupBy(doc => doc.Type)
            .Select(g => new { Type = g.Key.ToString(), Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Recent downloads ──
        var recentDownloads = await downloadLogs
            .OrderByDescending(a => a.OccurredAt)
            .Take(50)
            .ToListAsync(ct);

        var recentDocIds = recentDownloads
            .Where(r => r.DocumentId != null)
            .Select(r => r.DocumentId!.Value)
            .Distinct()
            .ToList();

        var recentDocs = recentDocIds.Count > 0
            ? await context.Documents
                .Where(d => recentDocIds.Contains(d.Id))
                .Select(d => new { d.Id, d.Title })
                .ToListAsync(ct)
            : [];

        var docLookup = recentDocs.ToDictionary(d => d.Id, d => d.Title);

        var recentDownloadsWithTitle = recentDownloads.Select(r => new
        {
            documentId = r.DocumentId,
            title = r.DocumentId != null && docLookup.TryGetValue(r.DocumentId.Value, out var t) ? t : null,
            country = r.Country,
            ipAddress = r.IpAddress,
            occurredAt = r.OccurredAt
        }).ToList();

        return Ok(new
        {
            totalDownloads,
            downloadsToday,
            downloadsThisWeek,
            downloadsThisMonth,
            downloadsByDay,
            downloadsByMonth,
            topDocuments = topDocumentsWithDetails,
            downloadsByCountry,
            downloadsByType,
            recentDownloads = recentDownloadsWithTitle
        });
    }

    [HttpGet("author/{name}")]
    public async Task<IActionResult> GetAuthorStats(string name, CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var decodedName = Uri.UnescapeDataString(name);

        // ── Document IDs authored by this person ──
        var docIds = await context.DocumentAuthors
            .Where(da => da.Name == decodedName && da.Document != null && da.Document.DeletedAt == null)
            .Select(da => da.Document!.Id)
            .Distinct()
            .ToListAsync(ct);

        var totalDocs = docIds.Count;

        var documents = await context.Documents
            .Where(d => docIds.Contains(d.Id))
            .Select(d => new
            {
                d.Id,
                d.Title,
                type = d.Type.ToString(),
                d.PublishedAt,
                d.Status,
                authors = d.Authors.OrderBy(a => a.Order).Select(a => a.Name).ToList()
            })
            .ToListAsync(ct);

        // ── Docs by type ──
        var docsByType = documents
            .GroupBy(d => d.type)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToList();

        // ── Docs by year ──
        var docsByYear = documents
            .Where(d => d.PublishedAt.HasValue)
            .GroupBy(d => d.PublishedAt!.Value.Year)
            .Select(g => new { Year = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Year)
            .ToList();

        // ── Co-authors ──
        var coauthors = await context.DocumentAuthors
            .Where(da => da.Name != decodedName && docIds.Contains(da.Document!.Id))
            .GroupBy(da => da.Name)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(20)
            .ToListAsync(ct);

        // ── Downloads ──
        var downloadLogs = context.AccessLogs
            .Where(a => a.Action == AccessAction.Download && a.DocumentId != null && docIds.Contains(a.DocumentId.Value));

        var totalDownloads = await downloadLogs.CountAsync(ct);

        var downloadsByMonth = await downloadLogs
            .GroupBy(a => new { a.OccurredAt.Year, a.OccurredAt.Month })
            .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Count = g.Count() })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync(ct);

        var downloadsByCountry = await downloadLogs
            .Where(a => a.Country != null)
            .GroupBy(a => a.Country)
            .Select(g => new { Country = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Views ──
        var totalViews = await context.AccessLogs
            .CountAsync(a => a.Action == AccessAction.View && a.DocumentId != null && docIds.Contains(a.DocumentId.Value), ct);

        // ── Activity last 30 days ──
        var activity30d = await context.AccessLogs
            .Where(a => a.DocumentId != null && docIds.Contains(a.DocumentId.Value) && a.OccurredAt >= DateTime.UtcNow.AddDays(-30))
            .GroupBy(a => a.OccurredAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync(ct);

        return Ok(new
        {
            author = decodedName,
            totalDocuments = totalDocs,
            totalDownloads,
            totalViews,
            documents,
            docsByType,
            docsByYear,
            downloadsByMonth,
            downloadsByCountry,
            coauthors,
            activity30d
        });
    }

    [HttpGet("comprehensive")]
    public async Task<IActionResult> GetComprehensive(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
        var published = context.Documents.Where(d => d.DeletedAt == null && d.Status == DocumentStatus.Published);

        // ── General ──
        var totalDocs = await context.Documents.CountAsync(d => d.DeletedAt == null, ct);
        var publishedDocs = await published.CountAsync(ct);
        var totalAuthors = await context.DocumentAuthors.CountAsync(ct);

        // ── Documents by type ──
        var docsByType = await published
            .GroupBy(d => d.Type)
            .Select(g => new { Type = g.Key.ToString(), Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Documents by year ──
        var docsByYear = await published
            .Where(d => d.PublishedAt.HasValue)
            .GroupBy(d => d.PublishedAt!.Value.Year)
            .Select(g => new { Year = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Year)
            .ToListAsync(ct);

        // ── Top authors ──
        var topAuthors = await context.DocumentAuthors
            .Where(da => da.Document != null && da.Document.DeletedAt == null && da.Document.Status == DocumentStatus.Published)
            .GroupBy(da => da.Name)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(20)
            .ToListAsync(ct);

        // ── Authors with ORCID ──
        var authorsWithOrcid = await context.DocumentAuthors
            .Where(da => da.Orcid != null && da.Document != null && da.Document.DeletedAt == null && da.Document.Status == DocumentStatus.Published)
            .Select(da => da.Name)
            .Distinct()
            .CountAsync(ct);

        // ── Access logs breakdown ──
        var totalViews = await context.AccessLogs.CountAsync(a => a.Action == AccessAction.View, ct);
        var totalDownloads = await context.AccessLogs.CountAsync(a => a.Action == AccessAction.Download, ct);
        var totalSearches = await context.AccessLogs.CountAsync(a => a.Action == AccessAction.Search, ct);
        var totalVisits = await context.AccessLogs.CountAsync(a => a.Action == AccessAction.PageView, ct);
        var uniqueVisitors = await context.AccessLogs
            .Where(a => a.Action == AccessAction.PageView && a.IpAddress != null)
            .Select(a => a.IpAddress)
            .Distinct()
            .CountAsync(ct);

        // ── Geographic data for views ──
        var viewsByCountry = await context.AccessLogs
            .Where(a => a.Action == AccessAction.View && a.Country != null)
            .GroupBy(a => a.Country)
            .Select(g => new { Country = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Geographic data for downloads ──
        var downloadsByCountry = await context.AccessLogs
            .Where(a => a.Action == AccessAction.Download && a.Country != null)
            .GroupBy(a => a.Country)
            .Select(g => new { Country = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Activity last 30 days ──
        var activity30d = await context.AccessLogs
            .Where(a => a.OccurredAt >= DateTime.UtcNow.AddDays(-30))
            .GroupBy(a => a.OccurredAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync(ct);

        // ── Documents by department ──
        var docsByDepartment = await published
            .Where(d => d.Department != null)
            .GroupBy(d => d.Department)
            .Select(g => new { Department = g.Key!, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Documents by degree program ──
        var docsByDegreeProgram = await published
            .Where(d => d.DegreeProgram != null)
            .GroupBy(d => d.DegreeProgram)
            .Select(g => new { Program = g.Key!, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Top keywords ──
        var topKeywords = await context.Keywords
            .Select(k => new { Word = k.Value, Count = k.Documents.Count(d => d.DeletedAt == null && d.Status == DocumentStatus.Published) })
            .OrderByDescending(x => x.Count)
            .Where(x => x.Count > 0)
            .Take(30)
            .ToListAsync(ct);

        // ── Collections ──
        var totalCollections = await context.Collections.CountAsync(c => c.DeletedAt == null, ct);

        // ── Documents per collection ──
        var docsByCollection = await published
            .GroupBy(d => d.Collection!.Name)
            .Select(g => new { Collection = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // ── Total users ──
        var totalUsers = await context.Users.CountAsync(u => u.IsActive, ct);

        // ── Total degree programs ──
        var totalDegreePrograms = await context.DegreePrograms.CountAsync(ct);

        // ── Top searched queries ──
        var topSearches = await context.AccessLogs
            .Where(a => a.Action == AccessAction.Search && a.SearchQuery != null)
            .GroupBy(a => a.SearchQuery!.ToLower())
            .Select(g => new { Query = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(15)
            .ToListAsync(ct);

        // ── Documents with AI processing ──
        var totalWithAi = await context.Documents.CountAsync(d => d.DeletedAt == null && d.AiMetadata != null, ct);
        var totalWithAiFailed = totalWithAi > 0
            ? await context.AiMetadata.CountAsync(a => a.Confidence != null && a.Confidence == 0, ct)
            : 0;

        return Ok(new
        {
            totals = new
            {
                documents = totalDocs,
                publishedDocuments = publishedDocs,
                authors = totalAuthors,
                authorsWithOrcid,
                users = totalUsers,
                collections = totalCollections,
                degreePrograms = totalDegreePrograms,
                views = totalViews,
                downloads = totalDownloads,
                searches = totalSearches,
                visits = totalVisits,
                uniqueVisitors,
                documentsWithAi = totalWithAi,
                aiFailed = totalWithAiFailed,
                viewsByCountry,
                downloadsByCountry
            },
            docsByType,
            docsByYear,
            topAuthors,
            activity30d,
            docsByDepartment,
            docsByDegreeProgram,
            topKeywords,
            docsByCollection,
            topSearches
        });
    }
}
