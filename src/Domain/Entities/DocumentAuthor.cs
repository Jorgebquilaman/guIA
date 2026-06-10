namespace GuIA.Domain.Entities;

public class DocumentAuthor
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Orcid { get; set; }
    public int Order { get; set; }
}
