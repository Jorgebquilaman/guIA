using GuIA.Application.DTOs;
using GuIA.Application.UseCases.MetadataFields;
using GuIA.Application.UseCases.MetadataSchemas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GuIA.API.Controllers;

public sealed class MetadataSchemasController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMetadataSchemasQuery(), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Create([FromBody] CreateSchemaRequest request, CancellationToken ct)
    {
        var id = await Mediator.Send(
            new CreateMetadataSchemaCommand(request.DocumentTypeName, request.Label, request.IsActive, request.SortOrder, request.CloneFromSchemaId),
            ct);
        return Ok(new { id });
    }

    [HttpGet("{documentType}")]
    public async Task<IActionResult> GetByType(string documentType, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMetadataSchemaByTypeQuery(documentType), ct);
        if (result == null)
            return NotFound("SchemaNotFound", $"No schema found for document type '{documentType}'.");
        return Ok(result);
    }

    [HttpGet("id/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMetadataSchemaByIdQuery(id), ct);
        if (result == null)
            return NotFound("SchemaNotFound", $"No schema found with id '{id}'.");
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct, [FromQuery] bool force = false)
    {
        await Mediator.Send(new DeleteMetadataSchemaCommand(id, force), ct);
        return Ok(new { message = "Schema deleted." });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSchemaRequest request, CancellationToken ct)
    {
        await Mediator.Send(new UpdateMetadataSchemaCommand(id, request.Label, request.IsActive, request.SortOrder), ct);
        return Ok(new { message = "Schema updated." });
    }

    [HttpGet("{schemaId}/fields")]
    public async Task<IActionResult> GetFields(Guid schemaId, CancellationToken ct)
    {
        var schema = await Mediator.Send(new GetMetadataSchemaByTypeQuery(schemaId.ToString()), ct);
        if (schema == null)
            return NotFound("SchemaNotFound", $"Schema {schemaId} not found.");
        return Ok(schema.Fields);
    }

    [HttpPost("{schemaId}/fields")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> CreateField(Guid schemaId, [FromBody] CreateFieldRequest request, CancellationToken ct)
    {
        var fieldId = await Mediator.Send(
            new CreateMetadataFieldCommand(
                schemaId,
                request.DublinCoreElement,
                request.Qualifier,
                request.InternalName,
                request.Label,
                request.FieldType,
                request.Obligatoriness,
                request.IsRepeatable,
                request.IsReadOnly,
                request.IsHidden,
                request.IsSimpleView,
                request.SortOrder,
                request.HelpText,
                request.AiPrompt,
                request.OptionsPipe),
            ct);
        return Ok(new { id = fieldId });
    }

    [HttpPut("fields/{fieldId}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> UpdateField(Guid fieldId, [FromBody] UpdateFieldRequest request, CancellationToken ct)
    {
        await Mediator.Send(
            new UpdateMetadataFieldCommand(
                fieldId,
                request.Label,
                request.IsRequired,
                request.Obligatoriness,
                request.SortOrder,
                request.IsHidden,
                request.HelpText,
                request.DublinCoreElement,
                request.Qualifier,
                request.InternalName,
                request.FieldType,
                request.IsRepeatable,
                request.IsReadOnly,
                request.IsSimpleView,
                request.AiPrompt),
            ct);
        return Ok(new { message = "Field updated." });
    }

    [HttpDelete("fields/{fieldId}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> DeleteField(Guid fieldId, CancellationToken ct)
    {
        await Mediator.Send(new DeleteMetadataFieldCommand(fieldId), ct);
        return Ok(new { message = "Field deleted." });
    }

    [HttpPut("fields/{fieldId}/options")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> UpdateFieldOptions(Guid fieldId, [FromBody] List<FieldOptionInput> options, CancellationToken ct)
    {
        await Mediator.Send(new UpdateFieldOptionsCommand(fieldId, options), ct);
        return Ok(new { message = "Options updated." });
    }
}

public record UpdateSchemaRequest(string Label, bool IsActive, int SortOrder);
public record CreateSchemaRequest(string DocumentTypeName, string Label, bool IsActive, int SortOrder, Guid? CloneFromSchemaId);
public record CreateFieldRequest(
    string DublinCoreElement, string? Qualifier, string InternalName, string Label,
    string FieldType, string Obligatoriness, bool IsRepeatable, bool IsReadOnly, bool IsHidden,
    bool IsSimpleView, int SortOrder, string? HelpText, string? AiPrompt = null, string? OptionsPipe = null);
public record UpdateFieldRequest(
    string Label, bool IsRequired, string Obligatoriness, int SortOrder, bool IsHidden, string? HelpText,
    string? DublinCoreElement = null, string? Qualifier = null, string? InternalName = null,
    string? FieldType = null, bool? IsRepeatable = null, bool? IsReadOnly = null, bool? IsSimpleView = null,
    string? AiPrompt = null);
