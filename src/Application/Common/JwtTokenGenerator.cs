using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GuIA.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GuIA.Application.Common;

public interface IJwtTokenGenerator
{
    (string token, DateTime expiresAt) GenerateAccessToken(User user);
    string GenerateRefreshToken();
}

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string token, DateTime expiresAt) GenerateAccessToken(User user)
    {
        string secret = _configuration["Jwt:Secret"]!;
        string issuer = _configuration["Jwt:Issuer"]!;
        string audience = _configuration["Jwt:Audience"]!;
        int expirationMinutes = int.Parse(_configuration["Jwt:AccessTokenExpirationMinutes"] ?? "15");

        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(secret));
        SigningCredentials credentials = new(key, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email?.Value ?? string.Empty),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(ClaimTypes.Name, user.FullName)
        ];

        DateTime expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        JwtSecurityToken token = new(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public string GenerateRefreshToken()
    {
        byte[] randomBytes = new byte[64];
        using RandomNumberGenerator rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
