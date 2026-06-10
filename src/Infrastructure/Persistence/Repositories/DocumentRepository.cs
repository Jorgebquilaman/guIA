using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Infrastructure.Persistence.Repositories;

public class DocumentRepository
{
    private readonly AppDbContext _context;

    public DocumentRepository(AppDbContext context)
    {
        _context = context;
    }

    private IQueryable<Document> Query()
    {
        return _context.Documents
            .Include(d => d.Collection)
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .Include(d => d.Keywords)
            .Include(d => d.UploadedBy)
            .Include(d => d.AiMetadata);
    }

    public async Task<Document?> GetByIdAsync(Guid id)
    {
        return await Query()
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<List<Document>> GetByCollectionIdAsync(Guid collectionId)
    {
        return await Query()
            .Where(d => d.CollectionId == collectionId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
    }

    public async Task<List<Document>> GetByStatusAsync(DocumentStatus status)
    {
        return await Query()
            .Where(d => d.Status == status)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
    }

    public async Task AddAsync(Document document)
    {
        await _context.Documents.AddAsync(document);
    }

    public void Update(Document document)
    {
        _context.Documents.Update(document);
    }

    public async Task Delete(Guid id)
    {
        Document? document = await _context.Documents.FindAsync(id);
        if (document != null)
        {
            document.Delete();
        }
    }
}
