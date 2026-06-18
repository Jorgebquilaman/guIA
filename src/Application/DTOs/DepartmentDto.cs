namespace GuIA.Application.DTOs;

public class DepartmentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#1B4D3E";
    public string? Icon { get; set; }
    public List<DegreeProgramDto> DegreePrograms { get; set; } = new();

    public static DepartmentDto FromEntity(Domain.Entities.Department entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Color = entity.Color,
        Icon = entity.Icon,
        DegreePrograms = entity.DegreePrograms
            .Where(dp => !dp.IsDeleted)
            .OrderBy(dp => dp.Name)
            .Select(DegreeProgramDto.FromEntity)
            .ToList()
    };
}
