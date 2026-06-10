using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.SiteConfig;

public record UpdateSiteConfigCommand(
    bool ShowMessage, string MessageText, string? UpdatedBy = null
) : IRequest<SiteConfigDto>;

public class UpdateSiteConfigCommandHandler : IRequestHandler<UpdateSiteConfigCommand, SiteConfigDto>
{
    private readonly IAppDbContext _context;

    public UpdateSiteConfigCommandHandler(IAppDbContext context) => _context = context;

    public async Task<SiteConfigDto> Handle(UpdateSiteConfigCommand request, CancellationToken ct)
    {
        var config = await _context.SiteConfigs.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            config = new Domain.Entities.SiteConfig(request.ShowMessage, request.MessageText);
            _context.SiteConfigs.Add(config);
        }
        else
        {
            config.Update(request.ShowMessage, request.MessageText, request.UpdatedBy);
        }
        await _context.SaveChangesAsync(ct);
        return new SiteConfigDto
        {
            Id = config.Id,
            ShowMessage = config.ShowMessage,
            MessageText = config.MessageText
        };
    }
}
