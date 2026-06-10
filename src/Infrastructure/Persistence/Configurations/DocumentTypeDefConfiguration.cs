using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class DocumentTypeDefConfiguration : IEntityTypeConfiguration<DocumentTypeDef>
{
    public void Configure(EntityTypeBuilder<DocumentTypeDef> builder)
    {
        builder.ToTable("document_type_defs");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(50)
            .HasColumnName("name");

        builder.Property(t => t.Label)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnName("label");

        builder.Property(t => t.SortOrder)
            .HasColumnName("sort_order");

        builder.HasQueryFilter(t => t.DeletedAt == null);
    }
}
