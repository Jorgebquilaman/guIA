namespace GuIA.Domain.Entities;

public class DocumentFile
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public string StoredPath { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string? ThumbnailPath { get; set; }
}
