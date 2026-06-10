namespace GuIA.Application.DTOs;

public class CollectionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCollectionId { get; set; }
    public CollectionDto? ParentCollection { get; set; }
    public List<CollectionDto> SubCollections { get; set; } = new();
    public int DocumentCount { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
}
