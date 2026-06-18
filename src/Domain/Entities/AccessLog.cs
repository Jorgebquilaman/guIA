using GuIA.Domain.Enums;

namespace GuIA.Domain.Entities;

public class AccessLog : BaseEntity
{
    public Guid? DocumentId { get; private set; }
    public Guid? UserId { get; private set; }
    public string? IpAddress { get; private set; }
    public string? Country { get; private set; }
    public AccessAction Action { get; private set; }
    public string? SearchQuery { get; private set; }
    public DateTime OccurredAt { get; private set; }

    private AccessLog() { }

    public AccessLog(
        AccessAction action,
        Guid? documentId = null,
        Guid? userId = null,
        string? ipAddress = null,
        string? country = null,
        string? searchQuery = null)
    {
        Action = action;
        DocumentId = documentId;
        UserId = userId;
        IpAddress = ipAddress;
        Country = country;
        SearchQuery = searchQuery;
        OccurredAt = DateTime.UtcNow;
    }
}
