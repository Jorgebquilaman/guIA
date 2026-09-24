using GuIA.Domain.Entities;
using GuIA.Domain.Enums;

namespace GuIA.Application.Common;

/// <summary>
/// Public visibility is governed by Status == Published (same rule as the
/// search publicOnly filter). Admins see everything; owners see their own
/// documents in any status. Non-privileged access to anything else behaves
/// as "not found" (no existence leak).
/// </summary>
public static class DocumentVisibility
{
    public static bool CanView(Document document, ICurrentUserService currentUser)
    {
        if (currentUser.IsAuthenticated && currentUser.UserRole == "Admin")
            return true;

        if (currentUser.IsAuthenticated && currentUser.UserId != Guid.Empty && document.UploadedByUserId == currentUser.UserId)
            return true;

        return document.Status == DocumentStatus.Published;
    }
}
