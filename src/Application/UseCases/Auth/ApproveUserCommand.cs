using System.Security.Cryptography;
using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record ApproveUserCommand(Guid UserId) : IRequest;

public class ApproveUserCommandHandler : IRequestHandler<ApproveUserCommand>
{
    private readonly IAppDbContext _context;
    private readonly IEmailPort _email;

    public ApproveUserCommandHandler(IAppDbContext context, IEmailPort email)
    {
        _context = context;
        _email = email;
    }

    public async Task Handle(ApproveUserCommand request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        user.Activate();

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var resetToken = new PasswordResetToken(user.Id, token, DateTime.UtcNow.AddDays(7));
        _context.PasswordResetTokens.Add(resetToken);

        await _context.SaveChangesAsync(ct);

        var emailAddr = user.Email?.Value ?? string.Empty;
        var baseUrl = "http://localhost:5173";
        var setPasswordLink = $"{baseUrl}/reset-password?token={token}";

        var body = $"""
            <h2>Acceso aprobado - GuIA IUPA</h2>
            <p>Hola {user.FullName}, tu solicitud de acceso al Repositorio Institucional del IUPA ha sido aprobada.</p>
            <p>Hacé clic en el siguiente enlace para establecer tu contraseña:</p>
            <p><a href="{setPasswordLink}">{setPasswordLink}</a></p>
            <p>Este enlace expira en 7 días.</p>
            """;

        await _email.SendAsync(emailAddr, "Acceso aprobado - GuIA IUPA", body, ct);
    }
}
