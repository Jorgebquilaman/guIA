using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.SmtpConfig;

public record GetSmtpConfigQuery : IRequest<SmtpConfigDto?>;

public class GetSmtpConfigQueryHandler : IRequestHandler<GetSmtpConfigQuery, SmtpConfigDto?>
{
    private readonly IAppDbContext _context;

    public GetSmtpConfigQueryHandler(IAppDbContext context) => _context = context;

    public async Task<SmtpConfigDto?> Handle(GetSmtpConfigQuery request, CancellationToken ct)
    {
        var config = await _context.SmtpConfigs.FirstOrDefaultAsync(ct);
        if (config == null) return null;
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
