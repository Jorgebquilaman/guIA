using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuIA.Infrastructure.Persistence.Configurations;

public class DegreeProgramConfiguration : IEntityTypeConfiguration<DegreeProgram>
{
    public void Configure(EntityTypeBuilder<DegreeProgram> builder)
    {
        builder.ToTable("degree_programs");

        builder.HasKey(dp => dp.Id);

        builder.Property(dp => dp.Id)
            .HasColumnName("id");

        builder.Property(dp => dp.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(dp => dp.UpdatedAt)
            .HasColumnName("updated_at");

        builder.Property(dp => dp.DeletedAt)
            .HasColumnName("deleted_at");

        builder.Property(dp => dp.Name)
            .IsRequired()
            .HasMaxLength(300)
            .HasColumnName("name");

        builder.Property(dp => dp.DepartmentId)
            .HasColumnName("department_id");

        builder.HasQueryFilter(dp => dp.DeletedAt == null);
    }
}
