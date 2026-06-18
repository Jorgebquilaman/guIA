using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class MetadataFieldConfiguration : IEntityTypeConfiguration<MetadataField>
{
    public void Configure(EntityTypeBuilder<MetadataField> builder)
    {
        builder.ToTable("metadata_fields");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.DublinCoreElement).IsRequired().HasMaxLength(100).HasColumnName("dublin_core_element");
        builder.Property(f => f.Qualifier).HasMaxLength(100).HasColumnName("qualifier");
        builder.Property(f => f.InternalName).IsRequired().HasMaxLength(100).HasColumnName("internal_name");
        builder.Property(f => f.Label).IsRequired().HasMaxLength(300).HasColumnName("label");
        builder.Property(f => f.FieldType).IsRequired().HasConversion<string>().HasMaxLength(20).HasColumnName("field_type");
        builder.Property(f => f.IsRequired).HasColumnName("is_required");
        builder.Property(f => f.Obligatoriness).IsRequired().HasConversion<string>().HasMaxLength(30).HasColumnName("obligatoriness");
        builder.Property(f => f.IsRepeatable).HasColumnName("is_repeatable");
        builder.Property(f => f.IsReadOnly).HasColumnName("is_read_only");
        builder.Property(f => f.IsHidden).HasColumnName("is_hidden");
        builder.Property(f => f.SortOrder).HasColumnName("sort_order");
        builder.Property(f => f.HelpText).HasMaxLength(500).HasColumnName("help_text");

        builder.HasMany(f => f.Options)
            .WithOne(o => o.Field)
            .HasForeignKey(o => o.MetadataFieldId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(f => f.DeletedAt == null);
    }
}
