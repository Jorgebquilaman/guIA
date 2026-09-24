using GuIA.Domain.Enums;
using GuIA.Domain.Exceptions;
using GuIA.Domain.ValueObjects;

namespace GuIA.Domain.Entities;

public class User : BaseEntity
{
    public Email? Email { get; private set; }
    public string PasswordHash { get; private set; } = null!;
    public string FullName { get; private set; } = null!;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public int FailedLoginAttempts { get; private set; }
    public DateTime? LockoutEnd { get; private set; }
    public Guid? AccessCategoryId { get; private set; }
    public AccessCategory? AccessCategory { get; private set; }
    public bool AuthorizesPublication { get; private set; }
    public DateTime? DataConsentAt { get; private set; }
    public string? DataConsentText { get; private set; }
    public ICollection<Document> Documents { get; private set; } = new List<Document>();
    public ICollection<UserAuthorMetadataValue> AuthorMetadataValues { get; private set; } = new List<UserAuthorMetadataValue>();

    private User() { }

    public User(Email email, string passwordHash, string fullName, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainValidationException("Password hash cannot be empty.");
        if (string.IsNullOrWhiteSpace(fullName))
            throw new DomainValidationException("Full name cannot be empty.");

        Email = email;
        PasswordHash = passwordHash;
        FullName = fullName;
        Role = role;
        IsActive = true;
    }

    public void UpdateFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new DomainValidationException("Full name cannot be empty.");
        FullName = fullName;
    }

    public void UpdateEmail(Email email)
    {
        Email = email ?? throw new ArgumentNullException(nameof(email));
    }

    public void UpdatePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainValidationException("Password hash cannot be empty.");
        PasswordHash = passwordHash;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void ChangeRole(UserRole role)
    {
        Role = role;
    }

    public void SetAccessCategory(Guid? accessCategoryId)
    {
        AccessCategoryId = accessCategoryId;
    }

    public void SetPublicationConsent(bool authorizes, string? consentText)
    {
        AuthorizesPublication = authorizes;
        if (authorizes)
        {
            DataConsentAt = DateTime.UtcNow;
            DataConsentText = consentText;
        }
        else
        {
            DataConsentAt = null;
        }
    }

    public bool IsLockedOut => LockoutEnd.HasValue && LockoutEnd.Value > DateTime.UtcNow;

    public void RecordFailedLogin()
    {
        FailedLoginAttempts++;
        if (FailedLoginAttempts >= 5)
            LockoutEnd = DateTime.UtcNow.AddMinutes(15);
    }

    public void ResetFailedLogins()
    {
        FailedLoginAttempts = 0;
        LockoutEnd = null;
    }
}
