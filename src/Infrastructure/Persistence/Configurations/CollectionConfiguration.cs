using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class CollectionConfiguration : IEntityTypeConfiguration<Collection>
{
    public void Configure(EntityTypeBuilder<Collection> builder)
    {
        builder.ToTable("collections");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(300)
            .HasColumnName("name");

        builder.Property(c => c.Description)
            .HasColumnName("description")
            .HasColumnType("text");

        builder.Property(c => c.IsPublic)
            .HasColumnName("is_public");

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        builder.HasOne(c => c.ParentCollection)
            .WithMany(c => c.SubCollections)
            .HasForeignKey("parent_collection_id")
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Documents)
            .WithOne(d => d.Collection)
            .HasForeignKey(d => d.CollectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(c => c.DeletedAt == null);
    }
}
