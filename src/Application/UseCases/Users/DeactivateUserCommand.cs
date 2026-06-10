using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Users;

public record DeactivateUserCommand(Guid UserId) : IRequest;

public class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand>
{
    private readonly IAppDbContext _context;

    public DeactivateUserCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeactivateUserCommand request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new InvalidOperationException($"User {request.UserId} not found.");

        user.Deactivate();
        await _context.SaveChangesAsync(ct);
    }
}
