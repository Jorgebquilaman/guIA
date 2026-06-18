using GuIA.Domain.Enums;

namespace GuIA.Domain.Entities;

public class MetadataSchema : BaseEntity
{
    public string DocumentTypeName { get; private set; } = null!;
    public string Label { get; private set; } = null!;
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }
    public ICollection<MetadataField> Fields { get; private set; } = new List<MetadataField>();

    private MetadataSchema() { }

    public MetadataSchema(string documentTypeName, string label, bool isActive, int sortOrder)
    {
        DocumentTypeName = documentTypeName;
        Label = label;
        IsActive = isActive;
        SortOrder = sortOrder;
    }

    public void Update(string label, bool isActive, int sortOrder)
    {
        Label = label;
        IsActive = isActive;
        SortOrder = sortOrder;
        MarkAsUpdated();
    }
}
