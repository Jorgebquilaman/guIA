using GuIA.Domain.Enums;

namespace GuIA.Application.DTOs;

public class DocumentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DocumentType Type { get; set; }
    public DocumentStatus Status { get; set; }
    public Guid CollectionId { get; set; }
    public string CollectionName { get; set; } = string.Empty;
    public Guid UploadedByUserId { get; set; }
    public string UploadedByUserName { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public DateTime UploadedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool HasCoverImage { get; set; }
    public string? SourceUrl { get; set; }
    public AiMetadataDto? AiMetadata { get; set; }
    public List<DocumentFileDto> Files { get; set; } = new();
    public List<DocumentAuthorDto> Authors { get; set; } = new();
    public List<string> Keywords { get; set; } = new();

    // Dublin Core fields
    public string? AdvisorName { get; set; }
    public string? Institution { get; set; }
    public DateTime? PublicationDate { get; set; }
    public string? AbstractEs { get; set; }
    public string? License { get; set; }
    public string? Department { get; set; }
    public string? DegreeProgram { get; set; }
}

public sealed record AuthorDto(string Name, string? Email, string? Orcid, int Order);

public class DocumentAuthorDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Orcid { get; set; }
    public int Order { get; set; }
}

public class AiMetadataDto
{
    public string? Summary { get; set; }
    public string? ExtractedEntities { get; set; }
    public string? GeneratedDescription { get; set; }
    public double? Confidence { get; set; }
    public DateTime ProcessedAt { get; set; }
    public string? ModelVersion { get; set; }
}

public class DocumentFileDto
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public bool HasThumbnail { get; set; }
}
