using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class KeywordConfiguration : IEntityTypeConfiguration<Keyword>
{
    public void Configure(EntityTypeBuilder<Keyword> builder)
    {
        builder.ToTable("keywords");

        builder.HasKey(k => k.Id);

        builder.Property(k => k.Value)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnName("value");

        builder.Property(k => k.Source)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasColumnName("source");

        builder.HasIndex(k => k.Value);
    }
}
