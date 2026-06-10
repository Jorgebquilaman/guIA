using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using GuIA.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record LoginCommand(string Email, string Password) : IRequest<LoginResponseDto>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public LoginCommandHandler(IAppDbContext context, IJwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResponseDto> Handle(LoginCommand request, CancellationToken ct)
    {
        var email = new Email(request.Email);
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive, ct)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!PasswordHelper.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var (accessToken, expiresAt) = _tokenGenerator.GenerateAccessToken(user);
        string refreshTokenValue = _tokenGenerator.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(ct);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email?.Value ?? string.Empty,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }
        };
    }
}
