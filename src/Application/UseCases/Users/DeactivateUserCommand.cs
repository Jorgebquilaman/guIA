using GuIA.Application.Common;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Users;

public record DeactivateUserCommand(Guid UserId) : IRequest;

public class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeactivateUserCommandHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(DeactivateUserCommand request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new InvalidOperationException($"User {request.UserId} not found.");

        if (_currentUser.UserRole == UserRole.Curator.ToString() && user.Role == UserRole.Admin)
            throw new InvalidOperationException("Los curadores no pueden desactivar usuarios administradores.");

        user.Deactivate();
        await _context.SaveChangesAsync(ct);
    }
}
