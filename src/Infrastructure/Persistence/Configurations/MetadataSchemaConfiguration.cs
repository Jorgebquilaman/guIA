using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class MetadataSchemaConfiguration : IEntityTypeConfiguration<MetadataSchema>
{
    public void Configure(EntityTypeBuilder<MetadataSchema> builder)
    {
        builder.ToTable("metadata_schemas");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.DocumentTypeName).IsRequired().HasMaxLength(50).HasColumnName("document_type_name");
        builder.Property(s => s.Label).IsRequired().HasMaxLength(200).HasColumnName("label");
        builder.Property(s => s.IsActive).HasColumnName("is_active");
        builder.Property(s => s.SortOrder).HasColumnName("sort_order");

        builder.HasMany(s => s.Fields)
            .WithOne(f => f.Schema)
            .HasForeignKey(f => f.MetadataSchemaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(s => s.DeletedAt == null);
    }
}
