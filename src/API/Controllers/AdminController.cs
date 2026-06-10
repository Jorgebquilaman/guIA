using GuIA.Application.UseCases.AiSettings;
using GuIA.Application.UseCases.Auth;
using GuIA.Application.UseCases.SiteConfig;
using GuIA.Application.UseCases.SmtpConfig;
using GuIA.Application.UseCases.Users;
using GuIA.Domain.Enums;
using GuIA.Domain.Entities;
using GuIA.Application.Common;
using GuIA.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

[Authorize(Roles = "Admin")]
public sealed class AdminController : BaseApiController
{
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetUsersQuery(), ct);
        return Ok(result);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var command = new CreateUserCommand(request.Email, request.Password, request.FullName, request.Role);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var command = new UpdateUserCommand(id, request.FullName, request.Role);
        await Mediator.Send(command, ct);
        return Ok(new { message = "User updated successfully." });
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeactivateUser(Guid id, CancellationToken ct)
    {
        await Mediator.Send(new DeactivateUserCommand(id), ct);
        return Ok(new { message = "User deactivated successfully." });
    }

    [HttpGet("documents")]
    public async Task<IActionResult> GetDocuments(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var query = context.Documents
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .Include(d => d.Keywords)
            .Include(d => d.Collection)
            .Include(d => d.UploadedBy)
            .Include(d => d.AiMetadata)
            .Where(d => d.DeletedAt == null);

        if (Enum.TryParse<DocumentStatus>(status, ignoreCase: true, out var docStatus))
            query = query.Where(d => d.Status == docStatus);

        int totalCount = await query.CountAsync(ct);

        var documents = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = documents.Select(d => new DocumentDto
        {
            Id = d.Id,
            Title = d.Title,
            Description = d.Description,
            Type = d.Type,
            Status = d.Status,
            CollectionId = d.CollectionId,
            CollectionName = d.Collection?.Name ?? string.Empty,
            UploadedByUserId = d.UploadedByUserId,
            UploadedByUserName = d.UploadedBy?.FullName ?? string.Empty,
            IsPublic = d.IsPublic,
            UploadedAt = d.UploadedAt,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
            PublishedAt = d.PublishedAt,
            Authors = d.Authors.OrderBy(a => a.Order).Select(a => new DocumentAuthorDto
            {
                Id = a.Id,
                Name = a.Name,
                Email = a.Email,
                Orcid = a.Orcid,
                Order = a.Order
            }).ToList(),
            Keywords = d.Keywords.Select(k => k.Value).ToList(),
            Files = d.Files.Select(f => new DocumentFileDto
            {
                Id = f.Id,
                OriginalFileName = f.OriginalFileName,
                MimeType = f.MimeType,
                SizeBytes = f.SizeBytes,
                HasThumbnail = f.ThumbnailPath != null
            }).ToList(),
            AiMetadata = d.AiMetadata != null ? new AiMetadataDto
            {
                Summary = d.AiMetadata.Summary,
                ExtractedEntities = d.AiMetadata.ExtractedEntities,
                GeneratedDescription = d.AiMetadata.GeneratedDescription,
                Confidence = d.AiMetadata.Confidence,
                ProcessedAt = d.AiMetadata.ProcessedAt,
                ModelVersion = d.AiMetadata.ModelVersion
            } : null,
            AdvisorName = d.AdvisorName,
            Institution = d.Institution,
            PublicationDate = d.PublicationDate,
            AbstractEs = d.AbstractEs,
            License = d.License,
            Department = d.Department,
            DegreeProgram = d.DegreeProgram
        }).ToList();

        return Ok(new PagedResult<DocumentDto>(items, totalCount, page, pageSize));
    }

    [HttpGet("stats/overview")]
    public async Task<IActionResult> GetStatsOverview(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        int totalDocuments = await context.Documents.CountAsync(d => d.DeletedAt == null, ct);
        int draftCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Draft, ct);
        int publishedCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Published, ct);
        int processingCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Processing, ct);
        int rejectedCount = await context.Documents.CountAsync(d => d.DeletedAt == null && d.Status == DocumentStatus.Rejected, ct);
        int totalCollections = await context.Collections.CountAsync(c => c.DeletedAt == null, ct);
        int totalUsers = await context.Users.CountAsync(u => u.IsActive, ct);
        int recentUploads = await context.Documents
            .CountAsync(d => d.CreatedAt >= DateTime.UtcNow.AddDays(-7), ct);

        return Ok(new
        {
            totalDocuments,
            draftCount,
            publishedCount,
            processingCount,
            rejectedCount,
            totalUsers,
            totalCollections,
            recentUploads
        });
    }

    [HttpGet("ai-settings")]
    public async Task<IActionResult> GetAiSettings(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAiSettingsQuery(), ct);
        return Ok(result);
    }

    [HttpPut("ai-settings")]
    public async Task<IActionResult> UpdateAiSettings([FromBody] UpdateAiSettingsRequest request, CancellationToken ct)
    {
        var user = HttpContext.User.Identity?.Name;
        var command = new UpdateAiSettingsCommand(
            request.ApiUrl,
            request.ApiKey,
            request.Model,
            request.MaxTokens,
            user);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpGet("site-config")]
    public async Task<IActionResult> GetSiteConfig(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSiteConfigQuery(), ct);
        return Ok(result);
    }

    [HttpPut("site-config")]
    public async Task<IActionResult> UpdateSiteConfig([FromBody] UpdateSiteConfigRequest request, CancellationToken ct)
    {
        var user = HttpContext.User.Identity?.Name;
        var command = new UpdateSiteConfigCommand(request.ShowMessage, request.MessageText, user);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpGet("smtp-config")]
    public async Task<IActionResult> GetSmtpConfig(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSmtpConfigQuery(), ct);
        return Ok(result);
    }

    [HttpPut("smtp-config")]
    public async Task<IActionResult> UpdateSmtpConfig([FromBody] UpdateSmtpConfigRequest request, CancellationToken ct)
    {
        var user = HttpContext.User.Identity?.Name;
        var command = new UpdateSmtpConfigCommand(
            request.Host, request.Port, request.Username, request.Password,
            request.FromEmail, request.FromName, request.UseSsl, user);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpGet("users/pending")]
    public async Task<IActionResult> GetPendingUsers(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
        var pendingUsers = await context.Users
            .Where(u => !u.IsActive)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email != null ? u.Email.Value : string.Empty,
                FullName = u.FullName,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(ct);
        return Ok(pendingUsers);
    }

    [HttpPost("users/{id:guid}/approve")]
    public async Task<IActionResult> ApproveUser(Guid id, CancellationToken ct)
    {
        try
        {
            await Mediator.Send(new ApproveUserCommand(id), ct);
            return Ok(new { message = "Usuario aprobado exitosamente." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest("USER_ERROR", ex.Message);
        }
    }
}

public sealed record CreateUserRequest(string Email, string Password, string FullName, UserRole Role);
public sealed record UpdateUserRequest(string? FullName, UserRole? Role);
public sealed record UpdateAiSettingsRequest(string ApiUrl, string ApiKey, string Model, int MaxTokens);
public sealed record UpdateSiteConfigRequest(bool ShowMessage, string MessageText);
public sealed record UpdateSmtpConfigRequest(string Host, int Port, string Username, string Password, string FromEmail, string FromName, bool UseSsl);
