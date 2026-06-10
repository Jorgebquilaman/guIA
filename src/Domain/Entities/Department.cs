namespace GuIA.Domain.Entities;

public class Department : BaseEntity
{
    private readonly List<DegreeProgram> _degreePrograms = new();
    private Department() { Name = null!; Color = null!; }

    public Department(string name, string color)
    {
        Name = name;
        Color = color;
    }

    public string Name { get; private set; }
    public string Color { get; private set; }
    public IReadOnlyCollection<DegreeProgram> DegreePrograms => _degreePrograms.AsReadOnly();

    public void Update(string name, string color)
    {
        Name = name;
        Color = color;
        MarkAsUpdated();
    }

    public DegreeProgram AddDegreeProgram(string name)
    {
        var program = new DegreeProgram(name);
        program.SetDepartmentId(Id);
        _degreePrograms.Add(program);
        MarkAsUpdated();
        return program;
    }

    public void RemoveDegreeProgram(DegreeProgram program)
    {
        _degreePrograms.Remove(program);
        program.Delete();
        MarkAsUpdated();
    }
}
