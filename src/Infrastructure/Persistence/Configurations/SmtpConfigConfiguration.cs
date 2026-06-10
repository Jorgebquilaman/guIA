using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class SmtpConfigConfiguration : IEntityTypeConfiguration<SmtpConfig>
{
    public void Configure(EntityTypeBuilder<SmtpConfig> builder)
    {
        builder.ToTable("smtp_config");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Host).IsRequired().HasMaxLength(200).HasColumnName("host");
        builder.Property(c => c.Port).HasColumnName("port");
        builder.Property(c => c.Username).IsRequired().HasMaxLength(200).HasColumnName("username");
        builder.Property(c => c.Password).IsRequired().HasMaxLength(500).HasColumnName("password");
        builder.Property(c => c.FromEmail).IsRequired().HasMaxLength(200).HasColumnName("from_email");
        builder.Property(c => c.FromName).IsRequired().HasMaxLength(200).HasColumnName("from_name");
        builder.Property(c => c.UseSsl).HasColumnName("use_ssl");
        builder.Property(c => c.UpdatedBy).HasMaxLength(200).HasColumnName("updated_by");
    }
}
