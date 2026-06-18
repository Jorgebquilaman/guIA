using GuIA.Domain.Enums;
using GuIA.Application.UseCases.Search;
using Microsoft.AspNetCore.Mvc;

namespace GuIA.API.Controllers;

public sealed class SearchController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? keywords,
        [FromQuery] string? type,
        [FromQuery] Guid? collectionId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] bool publicOnly = true,
        [FromQuery] string? author = null,
        [FromQuery] string? career = null,
        [FromQuery] int? year = null,
        [FromQuery] string? department = null,
        CancellationToken ct = default)
    {
        DocumentType? docType = type switch
        {
            "Article" => DocumentType.Article,
            "Thesis" => DocumentType.Thesis,
            "Dataset" => DocumentType.Dataset,
            "Software" => DocumentType.Software,
            "Link" => DocumentType.Link,
            "Other" => DocumentType.Other,
            _ => null
        };
        // Accept lowercase variants too
        if (docType == null && type != null && Enum.TryParse<DocumentType>(type, true, out var parsed))
            docType = parsed;

        var query = new SearchDocumentsQuery(
            q,
            keywords?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            docType,
            collectionId,
            publicOnly,
            page,
            pageSize,
            dateFrom,
            dateTo,
            author,
            career,
            year,
            department);

        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("keywords")]
    public async Task<IActionResult> GetKeywordSuggestions([FromQuery] string q, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetKeywordSuggestionsQuery(q ?? string.Empty), ct);
        return Ok(result);
    }

    [HttpGet("authors")]
    public async Task<IActionResult> GetAuthorSuggestions([FromQuery] string q, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAuthorSuggestionsQuery(q ?? string.Empty), ct);
        return Ok(result);
    }
}
