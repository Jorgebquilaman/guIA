namespace GuIA.Application.DTOs;

public class AiSuggestionsDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? AbstractEs { get; set; }
    public string? AbstractEn { get; set; }
    public List<string> SuggestedKeywords { get; set; } = new();
    public List<string> SuggestedKeywordsEn { get; set; } = new();
    public List<AuthorDto> SuggestedAuthors { get; set; } = new();
    public string? SuggestedType { get; set; }
    public string? PublicationVersion { get; set; }
    public string? DigitalIdentifier { get; set; }
    public Dictionary<string, string> MetadataValues { get; set; } = new();
}
