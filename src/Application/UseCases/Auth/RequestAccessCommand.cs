using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using GuIA.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record RequestAccessCommand(string Email, string FullName, Guid? AccessCategoryId = null) : IRequest<UserDto>;

public class RequestAccessCommandHandler : IRequestHandler<RequestAccessCommand, UserDto>
{
    private readonly IAppDbContext _context;

    public RequestAccessCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(RequestAccessCommand request, CancellationToken ct)
    {
        var emailCheck = new Email(request.Email);
        bool emailExists = await _context.Users.AnyAsync(u => u.Email == emailCheck, ct);
        if (emailExists)
            throw new InvalidOperationException("Ya existe un usuario con ese correo electrónico.");

        var email = new Email(request.Email);
        var tempHash = PasswordHelper.Hash(Guid.NewGuid().ToString());
        var user = new User(email, tempHash, request.FullName, UserRole.Viewer);
        user.Deactivate();
        if (request.AccessCategoryId.HasValue)
        {
            var category = await _context.AccessCategories
                .FirstOrDefaultAsync(c => c.Id == request.AccessCategoryId.Value, ct);
            if (category == null || !category.IsActive)
                throw new InvalidOperationException("CATEGORIA: La categoría seleccionada no es válida.");
            user.SetAccessCategory(category.Id);
        }
        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email?.Value ?? string.Empty,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            AccessCategoryId = user.AccessCategoryId,
            AccessCategoryName = user.AccessCategoryId.HasValue
                ? (await _context.AccessCategories
                    .Where(c => c.Id == user.AccessCategoryId.Value)
                    .Select(c => c.Name)
                    .FirstOrDefaultAsync(ct))
                : null
        };
    }
}
