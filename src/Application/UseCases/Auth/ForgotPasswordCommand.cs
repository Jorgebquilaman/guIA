using System.Security.Cryptography;
using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record ForgotPasswordCommand(string Email) : IRequest;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly IAppDbContext _context;
    private readonly IEmailPort _email;

    public ForgotPasswordCommandHandler(IAppDbContext context, IEmailPort email)
    {
        _context = context;
        _email = email;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var users = await _context.Users
            .Where(u => u.Email != null)
            .ToListAsync(ct);
        var user = users.FirstOrDefault(u => u.Email?.Value == request.Email);

        if (user == null || !user.IsActive)
            return;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var resetToken = new PasswordResetToken(user.Id, token, DateTime.UtcNow.AddHours(1));
        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync(ct);

        var baseUrl = "http://localhost:5173";
        var resetLink = $"{baseUrl}/reset-password?token={token}";

        var body = $"""
            <h2>Restablecer contraseña</h2>
            <p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
            <p><a href="{resetLink}">{resetLink}</a></p>
            <p>Este enlace expira en 1 hora.</p>
            <p>Si no solicitaste este cambio, ignorá este mensaje.</p>
            """;

        await _email.SendAsync(request.Email, "Restablecer contraseña - GuIA IUPA", body, ct);
    }
}
