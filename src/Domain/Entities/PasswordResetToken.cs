namespace GuIA.Domain.Entities;

public class PasswordResetToken : BaseEntity
{
    public Guid UserId { get; private set; }
    public string Token { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool Used { get; private set; }

    public User User { get; private set; } = null!;

    private PasswordResetToken() { Token = null!; }

    public PasswordResetToken(Guid userId, string token, DateTime expiresAt)
    {
        UserId = userId;
        Token = token;
        ExpiresAt = expiresAt;
        Used = false;
    }

    public void MarkAsUsed()
    {
        Used = true;
        MarkAsUpdated();
    }

    public bool IsValid()
    {
        return !Used && ExpiresAt > DateTime.UtcNow;
    }
}
