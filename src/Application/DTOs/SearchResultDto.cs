namespace GuIA.Application.DTOs;

public class SearchResultDto
{
    public string Query { get; set; } = string.Empty;
    public List<DocumentDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public Dictionary<string, List<string>> Facets { get; set; } = new();
}
