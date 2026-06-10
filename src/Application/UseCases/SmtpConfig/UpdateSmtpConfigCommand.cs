using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.SmtpConfig;

public record UpdateSmtpConfigCommand(
    string Host, int Port, string Username, string Password,
    string FromEmail, string FromName, bool UseSsl, string? UpdatedBy = null
) : IRequest<SmtpConfigDto>;

public class UpdateSmtpConfigCommandHandler : IRequestHandler<UpdateSmtpConfigCommand, SmtpConfigDto>
{
    private readonly IAppDbContext _context;

    public UpdateSmtpConfigCommandHandler(IAppDbContext context) => _context = context;

    public async Task<SmtpConfigDto> Handle(UpdateSmtpConfigCommand request, CancellationToken ct)
    {
        var config = await _context.SmtpConfigs.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            config = new Domain.Entities.SmtpConfig(
                request.Host, request.Port, request.Username, request.Password,
                request.FromEmail, request.FromName, request.UseSsl);
            _context.SmtpConfigs.Add(config);
        }
        else
        {
            config.Update(request.Host, request.Port, request.Username, request.Password,
                request.FromEmail, request.FromName, request.UseSsl, request.UpdatedBy);
        }
        await _context.SaveChangesAsync(ct);
        return new SmtpConfigDto
        {
            Id = config.Id,
            Host = config.Host,
            Port = config.Port,
            Username = config.Username,
            Password = config.Password,
            FromEmail = config.FromEmail,
            FromName = config.FromName,
            UseSsl = config.UseSsl
        };
    }
}
