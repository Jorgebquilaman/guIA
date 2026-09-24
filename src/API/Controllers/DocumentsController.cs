using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Application.UseCases.Documents;
using GuIA.Application.UseCases.DocumentMetadata;
using GuIA.Application.UseCases.Validators;
using GuIA.Domain.ValueObjects;
using GuIA.Infrastructure.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

public sealed class DocumentsController : BaseApiController
{
    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> Upload(
        [FromForm] List<IFormFile> files,
        [FromForm] Guid? collectionId,
        [FromForm] string? title,
        [FromForm] bool isPublic = false,
        [FromForm] Guid? documentTypeId = null,
        [FromForm] IFormFile? coverImage = null,
        [FromForm] string? mediaLinks = null,
        CancellationToken ct = default)
    {
        Console.WriteLine($"[Upload] collectionId raw: {collectionId}, files: {files?.Count}");
        if (collectionId == null || collectionId == Guid.Empty)
            return BadRequest("COLLECTION_REQUIRED", "Debe seleccionar una colección.");

        var fileTuples = files
            .Select(f => (f.OpenReadStream(), f.FileName, f.ContentType))
            .ToList();

        (Stream Content, string FileName, string MimeType)? cover = null;
        if (coverImage != null)
            cover = (coverImage.OpenReadStream(), coverImage.FileName, coverImage.ContentType);

        List<MediaLink>? parsedLinks = null;
        if (!string.IsNullOrWhiteSpace(mediaLinks))
        {
            try
            {
                parsedLinks = System.Text.Json.JsonSerializer.Deserialize<List<MediaLink>>(mediaLinks, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch { }
        }

        var command = new UploadDocumentCommand(fileTuples, collectionId ?? Guid.Empty, title, isPublic, documentTypeId, cover, parsedLinks);
        var documentId = await Mediator.Send(command, ct);
        return Ok(new { documentId, message = "Document uploaded successfully." });
    }

    [HttpPost("upload-link")]
    [Authorize]
    public async Task<IActionResult> UploadLink([FromBody] UploadLinkRequest request, CancellationToken ct)
    {
        if (request.CollectionId == null || request.CollectionId == Guid.Empty)
            return BadRequest("COLLECTION_REQUIRED", "Debe seleccionar una colección.");

        var validator = new UploadLinkValidator();
        var validationResult = await validator.ValidateAsync(request.ToCommand(), ct);
        if (!validationResult.IsValid)
            return BadRequest("VALIDATION_ERROR", string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));

        var documentId = await Mediator.Send(request.ToCommand(), ct);
        return Ok(new { documentId, message = "Link uploaded successfully." });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDocumentByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPatch("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> PatchMetadata(Guid id, [FromBody] PatchDocumentRequest request, CancellationToken ct)
    {
        var command = new UpdateDocumentMetadataCommand(
            id,
            request.Title,
            request.Description,
            request.Type,
            request.Authors,
            request.Keywords,
            request.AdvisorName,
            request.Institution,
            request.PublicationDate,
            request.AbstractEs,
            request.License,
            request.Department,
            request.DegreeProgram,
            request.Language,
            request.DocumentTypeId,
            request.MediaLinks
        );
        await Mediator.Send(command, ct);
        return Ok(new { message = "Metadata updated successfully." });
    }

    /// <summary>
    /// Cambia la visibilidad del documento: público (todos) o privado
    /// (solo usuarios registrados). Permitido solo al owner o a un admin,
    /// sin importar el estado (incluye publicados).
    /// </summary>
    [HttpPut("{id:guid}/visibility")]
    [Authorize]
    public async Task<IActionResult> SetVisibility(Guid id, [FromBody] SetVisibilityRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized("AUTH_INVALID_TOKEN", "Invalid token.");

        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();
        var document = await context.Documents
            .FirstOrDefaultAsync(d => d.Id == id && d.DeletedAt == null, ct);
        if (document == null)
            return NotFound("DOCUMENT_NOT_FOUND", "Document not found.");

        var isOwner = document.UploadedByUserId == userId;
        var isAdmin = User.IsInRole("Admin");
        if (!isOwner && !isAdmin)
            return Forbid("FORBIDDEN", "Solo el propietario o un administrador pueden cambiar la visibilidad.");

        document.SetVisibility(request.IsPublic);
        await context.SaveChangesAsync(ct);

        return Ok(new { isPublic = document.IsPublic, message = document.IsPublic
            ? "Documento visible para todos."
            : "Documento privado: solo usuarios registrados pueden verlo y descargarlo." });
    }

    [HttpPut("{id:guid}/metadata")]
    [Authorize]
    public async Task<IActionResult> UpdateMetadata(Guid id, [FromBody] UpdateMetadataRequest request, CancellationToken ct)
    {
        var command = new UpdateDocumentMetadataCommand(
            id, request.Title, request.Description, null, null, request.Keywords,
            null, null, null, null, null, null, null, null);
        await Mediator.Send(command, ct);
        return Ok(new { message = "Metadata updated successfully." });
    }

    [HttpGet("{id:guid}/ai-suggestions")]
    [Authorize]
    public async Task<IActionResult> GetAiSuggestions(Guid id, [FromQuery] string? type = null, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetAiSuggestionsQuery(id, type), ct);
        if (result == null)
            return NotFound(new { message = "Could not generate AI suggestions for this document." });
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteDocumentCommand(id), ct);
        return Ok(new { message = "Document deleted successfully." });
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        await Mediator.Send(new PublishDocumentCommand(id), ct);
        return Ok(new { message = "Document published successfully." });
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectDocumentRequest request, CancellationToken ct)
    {
        await Mediator.Send(new RejectDocumentCommand(id, request.Reason), ct);
        return Ok(new { message = "Document rejected successfully." });
    }

    [HttpPost("{id:guid}/unpublish")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Unpublish(Guid id, CancellationToken ct)
    {
        await Mediator.Send(new UnpublishDocumentCommand(id), ct);
        return Ok(new { message = "Document unpublished successfully." });
    }

    [HttpGet("{id:guid}/download/{fileId:guid}")]
    public async Task<IActionResult> Download(Guid id, Guid fileId, [FromServices] IGeoIpService geoIp, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var country = await geoIp.ResolveCountryAsync(ip, ct);
        var isAdmin = HttpContext.User.Identity?.IsAuthenticated == true
            && HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value == "Admin";
        var result = await Mediator.Send(new GetDocumentDownloadQuery(id, fileId, ip, country, SkipLogging: isAdmin), ct);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpGet("{id:guid}/preview/{fileId:guid}")]
    public async Task<IActionResult> Preview(Guid id, Guid fileId, [FromServices] IGeoIpService geoIp, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var country = await geoIp.ResolveCountryAsync(ip, ct);
        var isAdmin = HttpContext.User.Identity?.IsAuthenticated == true
            && HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value == "Admin";
        var result = await Mediator.Send(new GetDocumentDownloadQuery(id, fileId, ip, country, SkipLogging: isAdmin), ct);
        return File(result.Content, result.ContentType);
    }

    [HttpGet("{id:guid}/thumbnail")]
    public async Task<IActionResult> GetThumbnail(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDocumentThumbnailQuery(id), ct);
        if (result == null)
            return NotFound();
        return File(result.Content, result.ContentType);
    }

    [HttpGet("{id:guid}/metadata-values")]
    public async Task<IActionResult> GetMetadataValues(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDocumentMetadataQuery(id), ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/metadata-values")]
    [Authorize]
    public async Task<IActionResult> SaveMetadataValues(Guid id, [FromBody] SaveDocumentMetadataRequest request, CancellationToken ct)
    {
        await Mediator.Send(new SetDocumentMetadataCommand(id, request.Values), ct);
        return Ok(new { message = "Metadata saved." });
    }
}

public sealed record PatchDocumentRequest(
    string? Title,
    string? Description,
    string? Type,
    List<AuthorDto>? Authors,
    List<string>? Keywords,
    string? AdvisorName,
    string? Institution,
    DateTime? PublicationDate,
    string? AbstractEs,
    string? License,
    string? Department,
    string? DegreeProgram,
    string? Language,
    Guid? DocumentTypeId = null,
    List<MediaLinkDto>? MediaLinks = null
);
public sealed record UpdateMetadataRequest(string? Title, string? Description, List<string>? Authors, List<string>? Keywords);
public sealed record RejectDocumentRequest(string Reason);
public sealed record SetVisibilityRequest(bool IsPublic);

public sealed record UploadLinkRequest(
    string SourceUrl,
    string Title,
    Guid? CollectionId,
    bool IsPublic = false,
    string? Description = null,
    string? DegreeProgram = null,
    string? Department = null,
    string? AdvisorName = null,
    string? Institution = null,
    string? License = null
)
{
    public UploadLinkCommand ToCommand() => new(
        SourceUrl, Title, CollectionId ?? Guid.Empty, IsPublic,
        Description, DegreeProgram, Department, AdvisorName, Institution, License
    );
}

public sealed record SaveDocumentMetadataRequest(List<SaveMetadataValueDto> Values);
