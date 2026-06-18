namespace GuIA.Application.DTOs;

public class DocumentTypeDefDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public Guid? MetadataSchemaId { get; set; }
    public string? MetadataSchemaLabel { get; set; }

    public static DocumentTypeDefDto FromEntity(Domain.Entities.DocumentTypeDef entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Label = entity.Label,
        SortOrder = entity.SortOrder,
        MetadataSchemaId = entity.MetadataSchemaId,
        MetadataSchemaLabel = entity.MetadataSchema?.Label,
    };
}
