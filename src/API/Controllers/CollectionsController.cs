using GuIA.Application.UseCases.Collections;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GuIA.API.Controllers;

public sealed class CollectionsController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetTree(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCollectionTreeQuery(), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCollectionRequest request, CancellationToken ct)
    {
        var command = new CreateCollectionCommand(request.Name, request.Description, request.ParentCollectionId, request.IsPublic);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCollectionRequest request, CancellationToken ct)
    {
        var command = new UpdateCollectionCommand(id, request.Name, request.Description, request.IsPublic);
        await Mediator.Send(command, ct);
        return Ok(new { message = "Collection updated successfully." });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteCollectionCommand(id), ct);
        return Ok(new { message = "Collection deleted successfully." });
    }

    [HttpGet("{id:guid}/documents")]
    public async Task<IActionResult> GetDocuments(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var query = new GetCollectionDocumentsQuery(id, page, pageSize);
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCollectionByIdQuery(id), ct);
        return Ok(result);
    }
}

public sealed record CreateCollectionRequest(string Name, string? Description, Guid? ParentCollectionId, bool IsPublic);
public sealed record UpdateCollectionRequest(string Name, string? Description, bool IsPublic);
