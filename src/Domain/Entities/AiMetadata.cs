namespace GuIA.Domain.Entities;

public class AiMetadata
{
    public Guid Id { get; set; }
    public string? Summary { get; set; }
    public string? ExtractedEntities { get; set; }
    public string? GeneratedDescription { get; set; }
    public double? Confidence { get; set; }
    public DateTime ProcessedAt { get; set; }
    public string? ModelVersion { get; set; }

    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
