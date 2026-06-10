using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class SiteConfigConfiguration : IEntityTypeConfiguration<SiteConfig>
{
    public void Configure(EntityTypeBuilder<SiteConfig> builder)
    {
        builder.ToTable("site_config");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.MessageText)
            .IsRequired()
            .HasMaxLength(2000)
            .HasColumnName("message_text");

        builder.Property(c => c.ShowMessage)
            .HasColumnName("show_message");

        builder.Property(c => c.UpdatedBy)
            .HasMaxLength(200)
            .HasColumnName("updated_by");
    }
}
