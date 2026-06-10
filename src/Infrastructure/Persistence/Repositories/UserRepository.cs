using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Infrastructure.Persistence.Repositories;

public class UserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email != null && u.Email.Value == email.ToLowerInvariant());
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    public void Update(User user)
    {
        _context.Users.Update(user);
    }

    public async Task Delete(Guid id)
    {
        User? user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            user.Delete();
        }
    }
}
