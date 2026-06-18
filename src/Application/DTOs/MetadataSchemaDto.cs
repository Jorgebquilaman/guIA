namespace GuIA.Application.DTOs;

public class MetadataSchemaDto
{
    public Guid Id { get; set; }
    public string DocumentTypeName { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public List<MetadataFieldDto> Fields { get; set; } = new();
}

public class MetadataFieldDto
{
    public Guid Id { get; set; }
    public Guid MetadataSchemaId { get; set; }
    public string DublinCoreElement { get; set; } = string.Empty;
    public string? Qualifier { get; set; }
    public string InternalName { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string Obligatoriness { get; set; } = string.Empty;
    public bool IsRepeatable { get; set; }
    public bool IsReadOnly { get; set; }
    public bool IsHidden { get; set; }
    public int SortOrder { get; set; }
    public string? HelpText { get; set; }
    public List<MetadataFieldOptionDto> Options { get; set; } = new();
}

public class MetadataFieldOptionDto
{
    public Guid Id { get; set; }
    public Guid MetadataFieldId { get; set; }
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }
}

public class DocumentMetadataValueDto
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Guid MetadataFieldId { get; set; }
    public string Value { get; set; } = string.Empty;
    public int RepeatIndex { get; set; }
}

public class SaveMetadataValueDto
{
    public Guid FieldId { get; set; }
    public string Value { get; set; } = string.Empty;
    public int RepeatIndex { get; set; }
}
