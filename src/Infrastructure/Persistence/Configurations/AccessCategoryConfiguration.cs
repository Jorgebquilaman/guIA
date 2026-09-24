using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class AccessCategoryConfiguration : IEntityTypeConfiguration<AccessCategory>
{
    public void Configure(EntityTypeBuilder<AccessCategory> builder)
    {
        builder.ToTable("access_categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnName("name");

        builder.Property(c => c.Description)
            .IsRequired()
            .HasMaxLength(500)
            .HasColumnName("description");

        builder.Property(c => c.IsActive)
            .HasColumnName("is_active");

        builder.Property(c => c.SortOrder)
            .HasColumnName("sort_order");

        builder.HasQueryFilter(c => c.DeletedAt == null);
    }
}
