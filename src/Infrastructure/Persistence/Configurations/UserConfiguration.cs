using GuIA.Domain.Entities;
using GuIA.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .HasConversion(
                v => v == null ? null : v.Value,
                v => v == null ? null : new Email(v))
            .IsRequired()
            .HasMaxLength(256)
            .HasColumnName("email");

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasColumnName("password_hash");

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(200)
            .HasColumnName("full_name");

        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasColumnName("role");

        builder.Property(u => u.IsActive)
            .HasColumnName("is_active");

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at");

        builder.HasMany(u => u.Documents)
            .WithOne(d => d.UploadedBy)
            .HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
