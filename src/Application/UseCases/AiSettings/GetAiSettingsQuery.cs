using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.AiSettings;

public record GetAiSettingsQuery : IRequest<AiProviderConfigDto?>;

public class GetAiSettingsQueryHandler : IRequestHandler<GetAiSettingsQuery, AiProviderConfigDto?>
{
    private readonly IAppDbContext _context;

    public GetAiSettingsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AiProviderConfigDto?> Handle(GetAiSettingsQuery request, CancellationToken ct)
    {
        var config = await _context.AiProviderConfigs
            .FirstOrDefaultAsync(ct);

        if (config == null)
            return null;

        return new AiProviderConfigDto
        {
            Id = config.Id,
            ApiUrl = config.ApiUrl,
            ApiKey = config.ApiKey,
            Model = config.Model,
            MaxTokens = config.MaxTokens,
            IsActive = config.IsActive
        };
    }
}
