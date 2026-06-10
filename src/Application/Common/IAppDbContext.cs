using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace GuIA.Application.Common;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Document> Documents { get; }
    DbSet<DocumentFile> DocumentFiles { get; }
    DbSet<DocumentAuthor> DocumentAuthors { get; }
    DbSet<Keyword> Keywords { get; }
    DbSet<Collection> Collections { get; }
    DbSet<AiMetadata> AiMetadata { get; }
    DbSet<AccessLog> AccessLogs { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AiProviderConfig> AiProviderConfigs { get; }
    DbSet<DocumentTypeDef> DocumentTypeDefs { get; }
    DbSet<Department> Departments { get; }
    DbSet<DegreeProgram> DegreePrograms { get; }
    DbSet<SiteConfig> SiteConfigs { get; }
    DbSet<SmtpConfig> SmtpConfigs { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }

    ChangeTracker ChangeTracker { get; }
    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
