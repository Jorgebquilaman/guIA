using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class DocumentMetadataValueConfiguration : IEntityTypeConfiguration<DocumentMetadataValue>
{
    public void Configure(EntityTypeBuilder<DocumentMetadataValue> builder)
    {
        builder.ToTable("document_metadata_values");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Value).IsRequired().HasColumnType("text").HasColumnName("value");
        builder.Property(v => v.RepeatIndex).HasColumnName("repeat_index");

        builder.HasOne(v => v.Document)
            .WithMany(d => d.MetadataValues)
            .HasForeignKey(v => v.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.Field)
            .WithMany()
            .HasForeignKey(v => v.MetadataFieldId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(v => v.DeletedAt == null);
    }
}
