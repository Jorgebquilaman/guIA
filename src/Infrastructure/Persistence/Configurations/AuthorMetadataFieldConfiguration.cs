using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class AuthorMetadataFieldConfiguration : IEntityTypeConfiguration<AuthorMetadataField>
{
    public void Configure(EntityTypeBuilder<AuthorMetadataField> builder)
    {
        builder.ToTable("author_metadata_fields");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.AccessCategoryId)
            .HasColumnName("access_category_id");

        builder.HasOne(f => f.AccessCategory)
            .WithMany()
            .HasForeignKey(f => f.AccessCategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(f => f.InternalName)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnName("internal_name");

        builder.Property(f => f.Label)
            .IsRequired()
            .HasMaxLength(200)
            .HasColumnName("label");

        builder.Property(f => f.FieldType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasColumnName("field_type");

        builder.Property(f => f.IsRequired)
            .HasColumnName("is_required");

        builder.Property(f => f.Obligatoriness)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasColumnName("obligatoriness");

        builder.Property(f => f.IsRepeatable)
            .HasColumnName("is_repeatable");

        builder.Property(f => f.IsHidden)
            .HasColumnName("is_hidden");

        builder.Property(f => f.SortOrder)
            .HasColumnName("sort_order");

        builder.Property(f => f.HelpText)
            .HasMaxLength(1000)
            .HasColumnName("help_text");

        builder.HasMany(f => f.Options)
            .WithOne(o => o.Field)
            .HasForeignKey(o => o.AuthorMetadataFieldId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(f => f.DeletedAt == null);
    }
}
