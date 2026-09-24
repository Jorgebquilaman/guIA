using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using GuIA.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Users;

public record CreateUserCommand(
    string Email,
    string Password,
    string FullName,
    UserRole Role,
    Guid? AccessCategoryId = null
) : IRequest<UserDto>;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateUserCommandHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UserDto> Handle(CreateUserCommand request, CancellationToken ct)
    {
        if (_currentUser.UserRole == UserRole.Curator.ToString() && request.Role == UserRole.Admin)
            throw new InvalidOperationException("Los curadores no pueden crear usuarios administradores.");

        var emailCheck = new Email(request.Email);
        bool emailExists = await _context.Users.AnyAsync(u => u.Email == emailCheck, ct);
        if (emailExists)
            throw new InvalidOperationException($"User with email {request.Email} already exists.");

        var email = new Email(request.Email);
        string passwordHash = PasswordHelper.Hash(request.Password);

        var user = new User(email, passwordHash, request.FullName, request.Role);
        if (request.AccessCategoryId.HasValue)
        {
            bool categoryExists = await _context.AccessCategories
                .AnyAsync(c => c.Id == request.AccessCategoryId.Value, ct);
            if (!categoryExists)
                throw new InvalidOperationException("La categoría de acceso indicada no existe.");
            user.SetAccessCategory(request.AccessCategoryId);
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
