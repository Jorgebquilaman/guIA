namespace GuIA.Domain.Entities;

public class MetadataFieldOption : BaseEntity
{
    public Guid MetadataFieldId { get; private set; }
    public MetadataField Field { get; private set; } = null!;
    public string Value { get; private set; } = null!;
    public string Label { get; private set; } = null!;
    public bool IsDefault { get; private set; }
    public int SortOrder { get; private set; }

    private MetadataFieldOption() { }

    public MetadataFieldOption(Guid metadataFieldId, string value, string label, bool isDefault, int sortOrder)
    {
        MetadataFieldId = metadataFieldId;
        Value = value;
        Label = label;
        IsDefault = isDefault;
        SortOrder = sortOrder;
    }

    public void Update(string value, string label, bool isDefault, int sortOrder)
    {
        Value = value;
        Label = label;
        IsDefault = isDefault;
        SortOrder = sortOrder;
        MarkAsUpdated();
    }
}
