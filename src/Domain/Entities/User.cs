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
    public ICollection<Document> Documents { get; private set; } = new List<Document>();

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
}
