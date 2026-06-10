namespace GuIA.Domain.Exceptions;

public class DocumentNotFoundException : DomainException
{
    public Guid DocumentId { get; }

    public DocumentNotFoundException(Guid documentId)
        : base($"Document with ID '{documentId}' was not found.")
    {
        DocumentId = documentId;
    }
}
