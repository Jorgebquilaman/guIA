using GuIA.Application.Common;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Users;

public record UpdateUserCommand(Guid UserId, string? FullName, UserRole? Role) : IRequest;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand>
{
    private readonly IAppDbContext _context;

    public UpdateUserCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateUserCommand request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new InvalidOperationException($"User {request.UserId} not found.");

        if (request.FullName != null)
            user.UpdateFullName(request.FullName);

        if (request.Role.HasValue)
            user.ChangeRole(request.Role.Value);

        await _context.SaveChangesAsync(ct);
    }
}
