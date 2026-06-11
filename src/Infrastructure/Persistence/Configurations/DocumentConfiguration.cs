using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(500)
            .HasColumnName("title");

        builder.Property(d => d.Description)
            .HasColumnName("description")
            .HasColumnType("text");

        builder.Property(d => d.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasColumnName("type");

        builder.Property(d => d.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasColumnName("status");

        builder.Property(d => d.UploadedAt)
            .HasColumnName("uploaded_at");

        builder.Property(d => d.PublishedAt)
            .HasColumnName("published_at");

        builder.Property(d => d.IsPublic)
            .HasColumnName("is_public");

        builder.Property(d => d.SearchVector)
            .HasColumnName("search_vector")
            .HasColumnType("text");

        builder.Property(d => d.CoverImagePath)
            .HasMaxLength(500)
            .HasColumnName("cover_image_path");

        builder.Property(d => d.SourceUrl)
            .HasMaxLength(2048)
            .HasColumnName("source_url");

        builder.Property(d => d.CoverImageMimeType)
            .HasMaxLength(100)
            .HasColumnName("cover_image_mime_type");

        // Dublin Core columns
        builder.Property(d => d.AdvisorName)
            .HasMaxLength(300)
            .HasColumnName("advisor_name");

        builder.Property(d => d.Institution)
            .HasMaxLength(300)
            .HasColumnName("institution");

        builder.Property(d => d.PublicationDate)
            .HasColumnName("publication_date");

        builder.Property(d => d.AbstractEs)
            .HasColumnName("abstract_es")
            .HasColumnType("text");

        builder.Property(d => d.License)
            .HasMaxLength(100)
            .HasColumnName("license");

        builder.Property(d => d.Department)
            .HasMaxLength(200)
            .HasColumnName("department");

        builder.Property(d => d.DegreeProgram)
            .HasMaxLength(300)
            .HasColumnName("degree_program");

        builder.HasOne(d => d.Collection)
            .WithMany(c => c.Documents)
            .HasForeignKey(d => d.CollectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.UploadedBy)
            .WithMany(u => u.Documents)
            .HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.Files)
            .WithOne(f => f.Document)
            .HasForeignKey(f => f.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(d => d.Authors)
            .WithOne(a => a.Document)
            .HasForeignKey(a => a.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(d => d.Keywords)
            .WithMany(k => k.Documents)
            .UsingEntity(j => j.ToTable("document_keywords"));

        builder.HasOne(d => d.AiMetadata)
            .WithMany(a => a.Documents)
            .HasForeignKey("ai_metadata_id")
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasQueryFilter(d => d.DeletedAt == null);
    }
}
