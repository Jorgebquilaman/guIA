using GuIA.Domain.Entities;
using GuIA.Domain.Enums;

namespace GuIA.Application.Common;

/// <summary>
/// Visibility rules: admins see everything; owners see their own documents
/// in any status. Published + IsPublic is visible to anyone. Published but
/// private (IsPublic == false) is visible only to authenticated users.
/// Non-privileged access to anything else behaves as "not found"
/// (no existence leak).
/// </summary>
public static class DocumentVisibility
{
    public static bool CanView(Document document, ICurrentUserService currentUser)
    {
        if (currentUser.IsAuthenticated && currentUser.UserRole == "Admin")
            return true;

        if (currentUser.IsAuthenticated && currentUser.UserId != Guid.Empty && document.UploadedByUserId == currentUser.UserId)
            return true;

        if (document.Status != DocumentStatus.Published)
            return false;

        if (!document.IsPublic)
            return currentUser.IsAuthenticated;

        return true;
    }
}
