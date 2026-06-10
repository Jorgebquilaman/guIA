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
    UserRole Role
) : IRequest<UserDto>;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserDto>
{
    private readonly IAppDbContext _context;

    public CreateUserCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(CreateUserCommand request, CancellationToken ct)
    {
        var emailCheck = new Email(request.Email);
        bool emailExists = await _context.Users.AnyAsync(u => u.Email == emailCheck, ct);
        if (emailExists)
            throw new InvalidOperationException($"User with email {request.Email} already exists.");

        var email = new Email(request.Email);
        string passwordHash = PasswordHelper.Hash(request.Password);

        var user = new User(email, passwordHash, request.FullName, request.Role);
        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email?.Value ?? string.Empty,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}
