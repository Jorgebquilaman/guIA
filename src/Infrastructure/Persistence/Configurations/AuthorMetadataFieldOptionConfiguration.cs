using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class AuthorMetadataFieldOptionConfiguration : IEntityTypeConfiguration<AuthorMetadataFieldOption>
{
    public void Configure(EntityTypeBuilder<AuthorMetadataFieldOption> builder)
    {
        builder.ToTable("author_metadata_field_options");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Value)
            .IsRequired()
            .HasMaxLength(300)
            .HasColumnName("value");

        builder.Property(o => o.Label)
            .IsRequired()
            .HasMaxLength(300)
            .HasColumnName("label");

        builder.Property(o => o.IsDefault)
            .HasColumnName("is_default");

        builder.Property(o => o.SortOrder)
            .HasColumnName("sort_order");

        builder.HasQueryFilter(o => o.DeletedAt == null);
    }
}
