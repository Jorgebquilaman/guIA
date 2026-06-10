using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using GuIA.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record RequestAccessCommand(string Email, string FullName) : IRequest<UserDto>;

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
