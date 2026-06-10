namespace GuIA.Domain.Exceptions;

public class CollectionNotFoundException : DomainException
{
    public Guid CollectionId { get; }

    public CollectionNotFoundException(Guid collectionId)
        : base($"Collection with ID '{collectionId}' was not found.")
    {
        CollectionId = collectionId;
    }
}
