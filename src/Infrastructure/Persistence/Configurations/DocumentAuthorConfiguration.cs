using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class DocumentAuthorConfiguration : IEntityTypeConfiguration<DocumentAuthor>
{
    public void Configure(EntityTypeBuilder<DocumentAuthor> builder)
    {
        builder.ToTable("document_authors");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(300)
            .HasColumnName("name");

        builder.Property(a => a.Email)
            .HasMaxLength(200)
            .HasColumnName("email");

        builder.Property(a => a.Orcid)
            .HasMaxLength(30)
            .HasColumnName("orcid");

        builder.Property(a => a.Order)
            .HasDefaultValue(0)
            .HasColumnName("order");
    }
}
