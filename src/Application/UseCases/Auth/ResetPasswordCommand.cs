using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record ResetPasswordCommand(string Token, string NewPassword) : IRequest;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IAppDbContext _context;

    public ResetPasswordCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        var resetToken = await _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == request.Token, ct);

        if (resetToken == null || !resetToken.IsValid())
            throw new InvalidOperationException("Token inválido o expirado.");

        var user = resetToken.User;
        user.UpdatePasswordHash(PasswordHelper.Hash(request.NewPassword));
        resetToken.MarkAsUsed();

        await _context.SaveChangesAsync(ct);
    }
}
