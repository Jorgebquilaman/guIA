using GuIA.Application.Common;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Users;

public record RejectUserCommand(Guid UserId) : IRequest;

public class RejectUserCommandHandler : IRequestHandler<RejectUserCommand>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RejectUserCommandHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(RejectUserCommand request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        if (user.IsActive)
            throw new InvalidOperationException("Solo se pueden rechazar solicitudes pendientes.");

        if (_currentUser.UserRole == UserRole.Curator.ToString() && user.Role == UserRole.Admin)
            throw new InvalidOperationException("Los curadores no pueden eliminar usuarios administradores.");

        // Borrado físico: la solicitud nunca tuvo acceso y no deja rastros en pendientes.
        // ExecuteDeleteAsync evita el interceptor de borrado lógico.
        await _context.Users
            .Where(u => u.Id == request.UserId && !u.IsActive)
            .ExecuteDeleteAsync(ct);
    }
}
