using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Infrastructure.Persistence.Repositories;

public class CollectionRepository
{
    private readonly AppDbContext _context;

    public CollectionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Collection?> GetByIdAsync(Guid id)
    {
        return await _context.Collections
            .Include(c => c.SubCollections)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<List<Collection>> GetAllAsync()
    {
        List<Collection> all = await _context.Collections
            .Include(c => c.SubCollections)
            .Where(c => c.ParentCollectionId == null)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return all;
    }

    public async Task<List<Collection>> GetSubCollectionsAsync(Guid parentId)
    {
        return await _context.Collections
            .Include(c => c.SubCollections)
            .Where(c => c.ParentCollectionId == parentId)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task AddAsync(Collection collection)
    {
        await _context.Collections.AddAsync(collection);
    }

    public void Update(Collection collection)
    {
        _context.Collections.Update(collection);
    }

    public async Task Delete(Guid id)
    {
        Collection? collection = await _context.Collections.FindAsync(id);
        if (collection != null)
        {
            collection.Delete();
        }
    }
}
