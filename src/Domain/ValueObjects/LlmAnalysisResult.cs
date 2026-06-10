namespace GuIA.Domain.ValueObjects;

public class LlmAnalysisResult
{
    public string? Summary { get; set; }
    public List<string> Keywords { get; set; } = new();
    public List<string> Authors { get; set; } = new();
    public string? Description { get; set; }
    public string? ExtractedEntities { get; set; }
    public double Confidence { get; set; }
}
