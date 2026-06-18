using GuIA.Domain.Enums;
using GuIA.Domain.Exceptions;
using GuIA.Domain.ValueObjects;

namespace GuIA.Domain.Entities;

public class Document : BaseEntity
{
    public string Title { get; private set; } = null!;
    public string? Description { get; private set; }
    public DocumentType Type { get; private set; }
    public DocumentStatus Status { get; private set; }
    public Guid CollectionId { get; private set; }
    public Collection? Collection { get; private set; }
    public Guid UploadedByUserId { get; private set; }
    public User? UploadedBy { get; private set; }
    public DateTime UploadedAt { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public bool IsPublic { get; private set; }
    public AiMetadata? AiMetadata { get; private set; }
    public string? SearchVector { get; private set; }
    public ICollection<DocumentFile> Files { get; private set; } = new List<DocumentFile>();
    public ICollection<DocumentAuthor> Authors { get; private set; } = new List<DocumentAuthor>();
    public ICollection<Keyword> Keywords { get; private set; } = new List<Keyword>();
    public ICollection<DocumentMetadataValue> MetadataValues { get; private set; } = new List<DocumentMetadataValue>();

    // Cover image
    public string? CoverImagePath { get; private set; }
    public string? CoverImageMimeType { get; private set; }

    // Source URL (for link-type documents)
    public string? SourceUrl { get; private set; }

    // Additional media links (MP3, video from Drive)
    public List<MediaLink> MediaLinks { get; private set; } = new();

    // Dublin Core fields
    public string? AdvisorName { get; private set; }
    public string? Institution { get; private set; }
    public DateTime? PublicationDate { get; private set; }
    public string? AbstractEs { get; private set; }
    public string? License { get; private set; }
    public string? Department { get; private set; }
    public string? DegreeProgram { get; private set; }

    private Document() { }

    public Document(
        string title,
        DocumentType type,
        Guid collectionId,
        Guid uploadedByUserId,
        bool isPublic)
    {
        SetTitle(title);
        Type = type;
        CollectionId = collectionId;
        UploadedByUserId = uploadedByUserId;
        UploadedAt = DateTime.UtcNow;
        IsPublic = isPublic;
        Status = DocumentStatus.Draft;
    }

    public void SetTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainValidationException("Document title cannot be empty.");
        Title = title;
    }

    public void SetSourceUrl(string? sourceUrl)
    {
        SourceUrl = sourceUrl;
    }

    public void SetDescription(string? description)
    {
        Description = description;
    }

    public void SetType(DocumentType type)
    {
        Type = type;
    }

    public void SetCollection(Guid collectionId)
    {
        CollectionId = collectionId;
    }

    public void SetVisibility(bool isPublic)
    {
        IsPublic = isPublic;
    }

    public void Publish(DateTime publishedAt)
    {
        if (Status != DocumentStatus.Draft && Status != DocumentStatus.Processing)
            throw new DomainValidationException(
                "Only documents in Draft or Processing status can be published.");
        if (Files.Count == 0 && string.IsNullOrWhiteSpace(SourceUrl))
            throw new DomainValidationException("Cannot publish a document with no files and no source URL.");
        Status = DocumentStatus.Published;
        PublishedAt = publishedAt;
    }

    public void Reject()
    {
        if (Status != DocumentStatus.Draft && Status != DocumentStatus.Processing)
            throw new DomainValidationException(
                "Only documents in Draft or Processing status can be rejected.");

        Status = DocumentStatus.Rejected;
    }

    public void MarkAsProcessing()
    {
        if (Status != DocumentStatus.Draft)
            throw new DomainValidationException(
                "Only documents in Draft status can be marked as Processing.");

        Status = DocumentStatus.Processing;
    }

    public void SetAiMetadata(AiMetadata metadata)
    {
        AiMetadata = metadata ?? throw new ArgumentNullException(nameof(metadata));
    }

    public void AddFile(DocumentFile file)
    {
        if (file == null)
            throw new ArgumentNullException(nameof(file));

        file.DocumentId = Id;
        Files.Add(file);
    }

    public void RemoveFile(DocumentFile file)
    {
        if (file == null)
            throw new ArgumentNullException(nameof(file));

        Files.Remove(file);
    }

    public void AddAuthor(DocumentAuthor author)
    {
        if (author == null)
            throw new ArgumentNullException(nameof(author));

        author.DocumentId = Id;
        Authors.Add(author);
    }

    public void RemoveAuthor(DocumentAuthor author)
    {
        if (author == null)
            throw new ArgumentNullException(nameof(author));

        Authors.Remove(author);
    }

    public void AddKeyword(Keyword keyword)
    {
        if (keyword == null)
            throw new ArgumentNullException(nameof(keyword));

        if (!Keywords.Any(k => k.Value == keyword.Value))
            Keywords.Add(keyword);
    }

    public void RemoveKeyword(Keyword keyword)
    {
        if (keyword == null)
            throw new ArgumentNullException(nameof(keyword));

        Keywords.Remove(keyword);
    }

    public void ClearKeywords()
    {
        Keywords.Clear();
    }

    public void SetCoverImage(string path, string mimeType)
    {
        CoverImagePath = path;
        CoverImageMimeType = mimeType;
    }

    // Dublin Core setters
    public void SetAdvisorName(string? advisorName)
    {
        AdvisorName = advisorName;
    }

    public void SetInstitution(string? institution)
    {
        Institution = institution;
    }

    public void SetPublicationDate(DateTime? publicationDate)
    {
        PublicationDate = publicationDate;
    }

    public void SetAbstractEs(string? abstractEs)
    {
        AbstractEs = abstractEs;
    }

    public void SetLicense(string? license)
    {
        License = license;
    }

    public void SetDepartment(string? department)
    {
        Department = department;
    }

    public void SetDegreeProgram(string? degreeProgram)
    {
        DegreeProgram = degreeProgram;
    }

    public void SetMediaLinks(List<MediaLink>? links)
    {
        MediaLinks = links ?? new();
    }
}
