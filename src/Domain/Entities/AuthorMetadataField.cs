using GuIA.Domain.Enums;

namespace GuIA.Domain.Entities;

public class AuthorMetadataField : BaseEntity
{
    public Guid AccessCategoryId { get; private set; }
    public AccessCategory AccessCategory { get; private set; } = null!;

    public string InternalName { get; private set; } = null!;
    public string Label { get; private set; } = null!;

    public FieldType FieldType { get; private set; }
    public bool IsRequired { get; private set; }
    public ObligatorinessLevel Obligatoriness { get; private set; }
    public bool IsRepeatable { get; private set; }
    public bool IsHidden { get; private set; }
    public int SortOrder { get; private set; }
    public string? HelpText { get; private set; }

    public ICollection<AuthorMetadataFieldOption> Options { get; private set; } = new List<AuthorMetadataFieldOption>();

    private AuthorMetadataField() { }

    public AuthorMetadataField(
        Guid accessCategoryId,
        string internalName,
        string label,
        FieldType fieldType,
        ObligatorinessLevel obligatoriness,
        bool isRepeatable,
        bool isHidden,
        int sortOrder,
        string? helpText)
    {
        AccessCategoryId = accessCategoryId;
        InternalName = internalName;
        Label = label;
        FieldType = fieldType;
        IsRequired = obligatoriness == ObligatorinessLevel.Mandatory;
        Obligatoriness = obligatoriness;
        IsRepeatable = isRepeatable;
        IsHidden = isHidden;
        SortOrder = sortOrder;
        HelpText = helpText;
    }

    public void Update(
        string label,
        bool isRequired,
        ObligatorinessLevel obligatoriness,
        int sortOrder,
        bool isHidden,
        string? helpText,
        FieldType? fieldType = null,
        bool? isRepeatable = null,
        string? internalName = null)
    {
        Label = label;
        IsRequired = isRequired;
        Obligatoriness = obligatoriness;
        SortOrder = sortOrder;
        IsHidden = isHidden;
        HelpText = helpText;

        if (!string.IsNullOrWhiteSpace(internalName)) InternalName = internalName;
        if (fieldType.HasValue) FieldType = fieldType.Value;
        if (isRepeatable.HasValue) IsRepeatable = isRepeatable.Value;

        MarkAsUpdated();
    }
}
