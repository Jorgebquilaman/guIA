namespace GuIA.Application.Common;

public interface ICurrentUserService
{
    Guid UserId { get; }
    string? UserRole { get; }
    string? UserEmail { get; }
    bool IsAuthenticated { get; }
}
