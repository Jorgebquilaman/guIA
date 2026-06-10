using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class DocumentFileConfiguration : IEntityTypeConfiguration<DocumentFile>
{
    public void Configure(EntityTypeBuilder<DocumentFile> builder)
    {
        builder.ToTable("document_files");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.OriginalFileName)
            .IsRequired()
            .HasMaxLength(500)
            .HasColumnName("original_file_name");

        builder.Property(f => f.StoredPath)
            .IsRequired()
            .HasMaxLength(1000)
            .HasColumnName("stored_path");

        builder.Property(f => f.MimeType)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnName("mime_type");

        builder.Property(f => f.SizeBytes)
            .HasColumnName("file_size_bytes");

        builder.Property(f => f.ThumbnailPath)
            .HasMaxLength(1000)
            .HasColumnName("thumbnail_path");
    }
}
