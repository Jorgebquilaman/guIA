using GuIA.Application.DTOs;
using GuIA.Application.UseCases.Documents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GuIA.API.Controllers;

public sealed class DocumentsController : BaseApiController
{
    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> Upload(
        [FromForm] List<IFormFile> files,
        [FromForm] Guid collectionId,
        [FromForm] string? title,
        [FromForm] bool isPublic = false,
        [FromForm] IFormFile? coverImage = null,
        CancellationToken ct = default)
    {
        var fileTuples = files
            .Select(f => (f.OpenReadStream(), f.FileName, f.ContentType))
            .ToList();

        (Stream Content, string FileName, string MimeType)? cover = null;
        if (coverImage != null)
            cover = (coverImage.OpenReadStream(), coverImage.FileName, coverImage.ContentType);

        var command = new UploadDocumentCommand(fileTuples, collectionId, title, isPublic, cover);
        await Mediator.Send(command, ct);
        return Ok(new { message = "Document uploaded successfully." });
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
            request.Language
        );
        await Mediator.Send(command, ct);
        return Ok(new { message = "Metadata updated successfully." });
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
    public async Task<IActionResult> GetAiSuggestions(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAiSuggestionsQuery(id), ct);
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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        await Mediator.Send(new PublishDocumentCommand(id), ct);
        return Ok(new { message = "Document published successfully." });
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectDocumentRequest request, CancellationToken ct)
    {
        await Mediator.Send(new RejectDocumentCommand(id, request.Reason), ct);
        return Ok(new { message = "Document rejected successfully." });
    }

    [HttpGet("{id:guid}/download/{fileId:guid}")]
    public async Task<IActionResult> Download(Guid id, Guid fileId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDocumentDownloadQuery(id, fileId), ct);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpGet("{id:guid}/preview/{fileId:guid}")]
    public async Task<IActionResult> Preview(Guid id, Guid fileId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDocumentDownloadQuery(id, fileId), ct);
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
    string? Language
);
public sealed record UpdateMetadataRequest(string? Title, string? Description, List<string>? Authors, List<string>? Keywords);
public sealed record RejectDocumentRequest(string Reason);
