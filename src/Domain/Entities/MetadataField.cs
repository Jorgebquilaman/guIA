using GuIA.Domain.Enums;

namespace GuIA.Domain.Entities;

public class MetadataField : BaseEntity
{
    public Guid MetadataSchemaId { get; private set; }
    public MetadataSchema Schema { get; private set; } = null!;

    public string DublinCoreElement { get; private set; } = null!;
    public string? Qualifier { get; private set; }
    public string InternalName { get; private set; } = null!;
    public string Label { get; private set; } = null!;

    public FieldType FieldType { get; private set; }
    public bool IsRequired { get; private set; }
    public ObligatorinessLevel Obligatoriness { get; private set; }
    public bool IsRepeatable { get; private set; }
    public bool IsReadOnly { get; private set; }
    public bool IsHidden { get; private set; }
    public int SortOrder { get; private set; }
    public string? HelpText { get; private set; }

    public ICollection<MetadataFieldOption> Options { get; private set; } = new List<MetadataFieldOption>();

    private MetadataField() { }

    public MetadataField(
        Guid metadataSchemaId,
        string dublinCoreElement,
        string? qualifier,
        string internalName,
        string label,
        FieldType fieldType,
        ObligatorinessLevel obligatoriness,
        bool isRepeatable,
        bool isReadOnly,
        bool isHidden,
        int sortOrder,
        string? helpText)
    {
        MetadataSchemaId = metadataSchemaId;
        DublinCoreElement = dublinCoreElement;
        Qualifier = qualifier;
        InternalName = internalName;
        Label = label;
        FieldType = fieldType;
        IsRequired = obligatoriness == ObligatorinessLevel.Mandatory;
        Obligatoriness = obligatoriness;
        IsRepeatable = isRepeatable;
        IsReadOnly = isReadOnly;
        IsHidden = isHidden;
        SortOrder = sortOrder;
        HelpText = helpText;
    }

    public void Update(string label, bool isRequired, ObligatorinessLevel obligatoriness, int sortOrder, bool isHidden, string? helpText)
    {
        Label = label;
        IsRequired = isRequired;
        Obligatoriness = obligatoriness;
        SortOrder = sortOrder;
        IsHidden = isHidden;
        HelpText = helpText;
        MarkAsUpdated();
    }
}
