using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class AccessLogConfiguration : IEntityTypeConfiguration<AccessLog>
{
    public void Configure(EntityTypeBuilder<AccessLog> builder)
    {
        builder.ToTable("access_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.IpAddress)
            .HasMaxLength(45)
            .HasColumnName("ip_address");

        builder.Property(l => l.Action)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasColumnName("action");

        builder.Property(l => l.SearchQuery)
            .HasColumnName("search_query")
            .HasMaxLength(500);

        builder.Property(l => l.OccurredAt)
            .HasColumnName("occurred_at");
    }
}
