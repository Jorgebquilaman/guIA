namespace GuIA.Domain.Entities;

public class AuthorMetadataFieldOption : BaseEntity
{
    public Guid AuthorMetadataFieldId { get; private set; }
    public AuthorMetadataField Field { get; private set; } = null!;

    public string Value { get; private set; } = null!;
    public string Label { get; private set; } = null!;
    public bool IsDefault { get; private set; }
    public int SortOrder { get; private set; }

    private AuthorMetadataFieldOption() { }

    public AuthorMetadataFieldOption(Guid authorMetadataFieldId, string value, string label, bool isDefault, int sortOrder)
    {
        AuthorMetadataFieldId = authorMetadataFieldId;
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
