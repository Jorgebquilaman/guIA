using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class AiProviderConfigConfiguration : IEntityTypeConfiguration<AiProviderConfig>
{
    public void Configure(EntityTypeBuilder<AiProviderConfig> builder)
    {
        builder.ToTable("ai_provider_config");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.ApiUrl)
            .IsRequired()
            .HasMaxLength(500)
            .HasColumnName("api_url");

        builder.Property(c => c.ApiKey)
            .IsRequired()
            .HasMaxLength(500)
            .HasColumnName("api_key");

        builder.Property(c => c.Model)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnName("model");

        builder.Property(c => c.MaxTokens)
            .HasColumnName("max_tokens");

        builder.Property(c => c.IsActive)
            .HasColumnName("is_active");

        builder.Property(c => c.UpdatedBy)
            .HasMaxLength(200)
            .HasColumnName("updated_by");

        builder.Property(c => c.SystemPrompt)
            .HasColumnType("text")
            .HasColumnName("system_prompt");
    }
}
