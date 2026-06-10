namespace GuIA.Application.DTOs;

public class DegreeProgramDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }

    public static DegreeProgramDto FromEntity(Domain.Entities.DegreeProgram entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        DepartmentId = entity.DepartmentId
    };
}
