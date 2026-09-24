namespace GuIA.Domain.Entities;

public class AccessCategory : BaseEntity
{
    private AccessCategory() { Name = null!; Description = null!; }

    public AccessCategory(string name, string description, int sortOrder)
    {
        Name = name;
        Description = description;
        SortOrder = sortOrder;
        IsActive = true;
    }

    public string Name { get; private set; }
    public string Description { get; private set; }
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }

    public void Update(string name, string description, int sortOrder, bool isActive)
    {
        Name = name;
        Description = description;
        SortOrder = sortOrder;
        IsActive = isActive;
        MarkAsUpdated();
    }
}
