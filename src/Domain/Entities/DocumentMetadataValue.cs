namespace GuIA.Domain.Entities;

public class DocumentMetadataValue : BaseEntity
{
    public Guid DocumentId { get; private set; }
    public Document Document { get; private set; } = null!;
    public Guid MetadataFieldId { get; private set; }
    public MetadataField Field { get; private set; } = null!;
    public string Value { get; private set; } = null!;
    public int RepeatIndex { get; private set; }

    private DocumentMetadataValue() { }

    public DocumentMetadataValue(Guid documentId, Guid metadataFieldId, string value, int repeatIndex)
    {
        DocumentId = documentId;
        MetadataFieldId = metadataFieldId;
        Value = value;
        RepeatIndex = repeatIndex;
    }

    public void SetValue(string value)
    {
        Value = value;
        MarkAsUpdated();
    }
}
