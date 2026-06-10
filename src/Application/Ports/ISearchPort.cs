using GuIA.Domain.Enums;

namespace GuIA.Application.Ports;

public record SearchQuery(
    string? TextQuery,
    List<string>? Keywords,
    DocumentType? Type,
    Guid? CollectionId,
    bool PublicOnly,
    int Page,
    int PageSize,
    DateTime? DateFrom,
    DateTime? DateTo,
    string? Author,
    string? DegreeProgram,
    int? Year,
    string? Department
)
{
    public SearchQuery() : this(null, null, null, null, false, 1, 20, null, null, null, null, null, null) { }
}

public record SearchResult(IReadOnlyList<Guid> ItemIds, int TotalCount, int Page, int PageSize);

public interface ISearchPort
{
    Task<SearchResult> SearchAsync(SearchQuery query, CancellationToken ct = default);
}
