using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class ThesaurusTermConfiguration : IEntityTypeConfiguration<ThesaurusTerm>
{
    public void Configure(EntityTypeBuilder<ThesaurusTerm> builder)
    {
        builder.ToTable("thesaurus_terms");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .HasColumnName("id");

        builder.Property(t => t.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(t => t.UpdatedAt)
            .HasColumnName("updated_at");

        builder.Property(t => t.DeletedAt)
            .HasColumnName("deleted_at");

        builder.Property(t => t.PreferredLabel)
            .IsRequired()
            .HasMaxLength(200)
            .HasColumnName("preferred_label");

        builder.Property(t => t.Language)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(10)
            .HasColumnName("language");

        builder.Property(t => t.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasColumnName("type");

        builder.Property(t => t.AltLabel)
            .HasMaxLength(200)
            .HasColumnName("alt_label");

        builder.Property(t => t.Definition)
            .HasColumnType("text")
            .HasColumnName("definition");

        builder.Property(t => t.IsActive)
            .IsRequired()
            .HasColumnName("is_active");

        builder.Property(t => t.EffectiveDate)
            .HasColumnName("effective_date");

        builder.Property(t => t.RetirementDate)
            .HasColumnName("retirement_date");

        // Parent-child relationship (self-referencing)
        builder.HasOne(t => t.ParentThesaurus)
            .WithMany(t => t.ChildThesauri)
            .HasForeignKey("ParentThesaurusId")
            .HasConstraintName("fk_thesaurus_terms_parent");

        builder.Property("ParentThesaurusId")
            .HasColumnName("parent_thesaurus_id");

        builder.HasQueryFilter(t => t.DeletedAt == null && t.IsActive);

        builder.HasIndex(t => t.PreferredLabel);
        builder.HasIndex(t => t.Type);
        builder.HasIndex(t => t.Language);
        builder.HasIndex(t => t.AltLabel);
        builder.HasIndex("ParentThesaurusId");
    }
}