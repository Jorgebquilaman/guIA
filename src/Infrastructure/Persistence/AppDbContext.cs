using GuIA.Application.Common;
using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace GuIA.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentFile> DocumentFiles => Set<DocumentFile>();
    public DbSet<DocumentAuthor> DocumentAuthors => Set<DocumentAuthor>();
    public DbSet<Keyword> Keywords => Set<Keyword>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<AiMetadata> AiMetadata => Set<AiMetadata>();
    public DbSet<AccessLog> AccessLogs => Set<AccessLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AiProviderConfig> AiProviderConfigs => Set<AiProviderConfig>();
    public DbSet<DocumentTypeDef> DocumentTypeDefs => Set<DocumentTypeDef>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<DegreeProgram> DegreePrograms => Set<DegreeProgram>();
    public DbSet<SiteConfig> SiteConfigs => Set<SiteConfig>();
    public DbSet<SmtpConfig> SmtpConfigs => Set<SmtpConfig>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (EntityEntry<BaseEntity> entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Property(nameof(BaseEntity.CreatedAt)).CurrentValue = DateTime.UtcNow;
                    entry.Property(nameof(BaseEntity.UpdatedAt)).CurrentValue = null;
                    break;

                case EntityState.Modified:
                    entry.Property(nameof(BaseEntity.UpdatedAt)).CurrentValue = DateTime.UtcNow;
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Property(nameof(BaseEntity.DeletedAt)).CurrentValue = DateTime.UtcNow;
                    entry.Property(nameof(BaseEntity.UpdatedAt)).CurrentValue = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
