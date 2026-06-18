namespace GuIA.Domain.Entities;

public class DocumentTypeDef : BaseEntity
{
    private DocumentTypeDef() { Name = null!; Label = null!; }

    public DocumentTypeDef(string name, string label, int sortOrder)
    {
        Name = name;
        Label = label;
        SortOrder = sortOrder;
    }

    public string Name { get; private set; }
    public string Label { get; private set; }
    public int SortOrder { get; private set; }
    public Guid? MetadataSchemaId { get; private set; }
    public MetadataSchema? MetadataSchema { get; private set; }

    public void Update(string name, string label, int sortOrder, Guid? metadataSchemaId)
    {
        Name = name;
        Label = label;
        SortOrder = sortOrder;
        MetadataSchemaId = metadataSchemaId;
        MarkAsUpdated();
    }
}
