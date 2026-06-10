using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class AiMetadataConfiguration : IEntityTypeConfiguration<AiMetadata>
{
    public void Configure(EntityTypeBuilder<AiMetadata> builder)
    {
        builder.ToTable("ai_metadata");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Summary)
            .HasColumnType("text")
            .HasColumnName("summary");

        builder.Property(a => a.ExtractedEntities)
            .HasColumnType("text")
            .HasColumnName("extracted_entities");

        builder.Property(a => a.GeneratedDescription)
            .HasColumnType("text")
            .HasColumnName("generated_description");

        builder.Property(a => a.Confidence)
            .HasColumnName("confidence");

        builder.Property(a => a.ProcessedAt)
            .HasColumnName("processed_at");

        builder.Property(a => a.ModelVersion)
            .HasMaxLength(50)
            .HasColumnName("model_version");
    }
}
