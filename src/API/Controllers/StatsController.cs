using GuIA.Application.Common;
using GuIA.Domain.Enums;
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
                degreePrograms = d.DegreePrograms
                    .Where(dp => dp.DeletedAt == null)
                    .OrderBy(dp => dp.Name)
                    .Select(dp => new { id = dp.Id, name = dp.Name })
                    .ToList()
            })
            .ToListAsync(ct);

        return Ok(departments);
    }
}
