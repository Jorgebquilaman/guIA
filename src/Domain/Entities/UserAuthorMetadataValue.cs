namespace GuIA.Domain.Entities;

public class UserAuthorMetadataValue : BaseEntity
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public Guid AuthorMetadataFieldId { get; private set; }
    public AuthorMetadataField Field { get; private set; } = null!;

    public string Value { get; private set; } = null!;
    public int RepeatIndex { get; private set; }

    private UserAuthorMetadataValue() { }

    public UserAuthorMetadataValue(Guid userId, Guid authorMetadataFieldId, string value, int repeatIndex)
    {
        UserId = userId;
        AuthorMetadataFieldId = authorMetadataFieldId;
        Value = value;
        RepeatIndex = repeatIndex;
    }
}
