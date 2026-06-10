using GuIA.Domain.Exceptions;

namespace GuIA.Domain.Entities;

public class Collection : BaseEntity
{
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public Guid? ParentCollectionId { get; private set; }
    public Collection? ParentCollection { get; private set; }
    public ICollection<Collection> SubCollections { get; private set; } = new List<Collection>();
    public ICollection<Document> Documents { get; private set; } = new List<Document>();
    public bool IsPublic { get; private set; }

    private Collection() { }

    public Collection(string name, bool isPublic, string? description = null, Guid? parentCollectionId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainValidationException("Collection name cannot be empty.");

        Name = name;
        IsPublic = isPublic;
        Description = description;
        ParentCollectionId = parentCollectionId;
    }

    public void SetName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainValidationException("Collection name cannot be empty.");
        Name = name;
    }

    public void SetDescription(string? description)
    {
        Description = description;
    }

    public void SetVisibility(bool isPublic)
    {
        IsPublic = isPublic;
    }

    public void SetParent(Guid? parentCollectionId)
    {
        if (parentCollectionId.HasValue && parentCollectionId.Value == Id)
            throw new DomainValidationException("A collection cannot be its own parent.");
        ParentCollectionId = parentCollectionId;
    }

    public void AddSubCollection(Collection subCollection)
    {
        if (subCollection == null)
            throw new ArgumentNullException(nameof(subCollection));
        if (SubCollections.Any(sc => sc.Id == subCollection.Id))
            return;

        subCollection.ParentCollectionId = Id;
        SubCollections.Add(subCollection);
    }
}
