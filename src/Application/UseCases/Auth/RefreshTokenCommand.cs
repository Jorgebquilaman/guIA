using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record RefreshTokenCommand(string RefreshToken) : IRequest<LoginResponseDto>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public RefreshTokenCommandHandler(IAppDbContext context, IJwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResponseDto> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var existingToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, ct)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        if (!existingToken.IsActive)
            throw new UnauthorizedAccessException("Refresh token is expired or revoked.");

        existingToken.RevokedAt = DateTime.UtcNow;

        var (accessToken, expiresAt) = _tokenGenerator.GenerateAccessToken(existingToken.User);
        string newRefreshTokenValue = _tokenGenerator.GenerateRefreshToken();

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = existingToken.UserId,
            Token = newRefreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync(ct);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshTokenValue,
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = existingToken.User.Id,
                Email = existingToken.User.Email?.Value ?? string.Empty,
                FullName = existingToken.User.FullName,
                Role = existingToken.User.Role,
                IsActive = existingToken.User.IsActive,
                CreatedAt = existingToken.User.CreatedAt
            }
        };
    }
}
