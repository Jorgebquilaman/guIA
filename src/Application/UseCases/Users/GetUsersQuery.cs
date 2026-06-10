using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Users;

public record GetUsersQuery : IRequest<List<UserDto>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, List<UserDto>>
{
    private readonly IAppDbContext _context;

    public GetUsersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserDto>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        return await _context.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email != null ? u.Email.Value : string.Empty,
                FullName = u.FullName,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync(ct);
    }
}
