using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class UserAuthorMetadataValueConfiguration : IEntityTypeConfiguration<UserAuthorMetadataValue>
{
    public void Configure(EntityTypeBuilder<UserAuthorMetadataValue> builder)
    {
        builder.ToTable("user_author_metadata_values");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.UserId)
            .HasColumnName("user_id");

        builder.HasOne(v => v.User)
            .WithMany(u => u.AuthorMetadataValues)
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(v => v.AuthorMetadataFieldId)
            .HasColumnName("author_metadata_field_id");

        builder.HasOne(v => v.Field)
            .WithMany()
            .HasForeignKey(v => v.AuthorMetadataFieldId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(v => v.Value)
            .HasColumnType("text")
            .HasColumnName("value");

        builder.Property(v => v.RepeatIndex)
            .HasColumnName("repeat_index");

        builder.HasQueryFilter(v => v.DeletedAt == null);
    }
}
