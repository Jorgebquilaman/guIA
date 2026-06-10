using GuIA.Domain.Exceptions;

namespace GuIA.Domain.ValueObjects;

public class Email : IEquatable<Email>
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainValidationException("Email cannot be empty.");

        try
        {
            var addr = new System.Net.Mail.MailAddress(value);
            if (addr.Address != value)
                throw new DomainValidationException($"'{value}' is not a valid email address.");
        }
        catch (FormatException)
        {
            throw new DomainValidationException($"'{value}' is not a valid email address.");
        }

        Value = value.ToLowerInvariant();
    }

    public override string ToString() => Value;

    public bool Equals(Email? other)
    {
        if (other is null) return false;
        return string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);
    }

    public override bool Equals(object? obj) => obj is Email other && Equals(other);

    public override int GetHashCode() => StringComparer.OrdinalIgnoreCase.GetHashCode(Value);

    public static implicit operator string(Email email) => email.Value;
}
