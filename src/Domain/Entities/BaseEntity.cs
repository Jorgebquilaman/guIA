namespace GuIA.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; protected set; }
    public DateTime? DeletedAt { get; protected set; }

    public bool IsDeleted => DeletedAt.HasValue;

    protected BaseEntity()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
    }

    public void MarkAsUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        DeletedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Restore()
    {
        DeletedAt = null;
        MarkAsUpdated();
    }

    public override bool Equals(object? obj)
    {
        if (obj is not BaseEntity other) return false;
        if (ReferenceEquals(this, other)) return true;
        if (GetType() != other.GetType()) return false;
        return Id == other.Id;
    }

    public override int GetHashCode() => Id.GetHashCode();

    public static bool operator ==(BaseEntity? left, BaseEntity? right)
    {
        if (left is null && right is null) return true;
        if (left is null || right is null) return false;
        return left.Equals(right);
    }

    public static bool operator !=(BaseEntity? left, BaseEntity? right) => !(left == right);
}
