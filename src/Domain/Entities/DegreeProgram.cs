namespace GuIA.Domain.Entities;

public class DegreeProgram : BaseEntity
{
    private DegreeProgram() { Name = null!; }

    public DegreeProgram(string name)
    {
        Name = name;
    }

    public string Name { get; private set; }
    public Guid DepartmentId { get; private set; }
    public Department? Department { get; private set; }

    public void SetDepartmentId(Guid departmentId)
    {
        DepartmentId = departmentId;
    }

    public void Update(string name)
    {
        Name = name;
        MarkAsUpdated();
    }

    public void Delete()
    {
        if (Department != null)
        {
            Department.RemoveDegreeProgram(this);
        }
        base.Delete();
    }
}
