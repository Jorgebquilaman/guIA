using System.Security.Claims;
using GuIA.Application.Common;

namespace GuIA.API.Services;

public class CurrentUserService : ICurrentUserService
{
    public Guid UserId { get; }
    public string? UserRole { get; }
    public string? UserEmail { get; }
    public bool IsAuthenticated { get; }

    public CurrentUserService(ClaimsPrincipal? principal)
    {
        if (principal?.Identity?.IsAuthenticated == true)
        {
            var nameId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(nameId, out var userId))
                UserId = userId;

            UserRole = principal.FindFirst(ClaimTypes.Role)?.Value;
            UserEmail = principal.FindFirst(ClaimTypes.Email)?.Value;
            IsAuthenticated = true;
        }
    }
}
