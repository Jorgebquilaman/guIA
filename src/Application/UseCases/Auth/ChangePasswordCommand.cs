using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Auth;

public record ChangePasswordCommand(Guid UserId, string CurrentPassword, string NewPassword) : IRequest;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly IAppDbContext _context;

    public ChangePasswordCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(ChangePasswordCommand request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new InvalidOperationException($"User {request.UserId} not found.");

        if (!PasswordHelper.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        user.UpdatePasswordHash(PasswordHelper.Hash(request.NewPassword));
        await _context.SaveChangesAsync(ct);
    }
}
