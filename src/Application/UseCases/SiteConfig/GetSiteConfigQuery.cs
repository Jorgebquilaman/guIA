using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.SiteConfig;

public record GetSiteConfigQuery : IRequest<SiteConfigDto?>;

public class GetSiteConfigQueryHandler : IRequestHandler<GetSiteConfigQuery, SiteConfigDto?>
{
    private readonly IAppDbContext _context;

    public GetSiteConfigQueryHandler(IAppDbContext context) => _context = context;

    public async Task<SiteConfigDto?> Handle(GetSiteConfigQuery request, CancellationToken ct)
    {
        var config = await _context.SiteConfigs.FirstOrDefaultAsync(ct);
        if (config == null) return null;
        return new SiteConfigDto
        {
            Id = config.Id,
            ShowMessage = config.ShowMessage,
            MessageText = config.MessageText
        };
    }
}
