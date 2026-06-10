using GuIA.Domain.Enums;
using GuIA.Domain.Exceptions;

namespace GuIA.Domain.Entities;

public class Keyword : BaseEntity
{
    public string Value { get; private set; } = null!;
    public KeywordSource Source { get; private set; }
    public ICollection<Document> Documents { get; private set; } = new List<Document>();

    private Keyword() { }

    public Keyword(string value, KeywordSource source)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainValidationException("Keyword value cannot be empty.");

        Value = value.ToLowerInvariant();
        Source = source;
    }

    public void UpdateSource(KeywordSource source)
    {
        Source = source;
    }
}
