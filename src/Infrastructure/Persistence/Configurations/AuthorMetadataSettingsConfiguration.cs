using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class AuthorMetadataSettingsConfiguration : IEntityTypeConfiguration<AuthorMetadataSettings>
{
    public void Configure(EntityTypeBuilder<AuthorMetadataSettings> builder)
    {
        builder.ToTable("author_metadata_settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.ConsentText)
            .HasColumnType("text")
            .HasColumnName("consent_text");
    }
}
