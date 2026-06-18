using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.AiSettings;

public record UpdateAiSettingsCommand(
    string ApiUrl,
    string ApiKey,
    string Model,
    int MaxTokens,
    string? UpdatedBy = null,
    string? SystemPrompt = null
) : IRequest<AiProviderConfigDto>;

public class UpdateAiSettingsCommandHandler : IRequestHandler<UpdateAiSettingsCommand, AiProviderConfigDto>
{
    private readonly IAppDbContext _context;

    public UpdateAiSettingsCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AiProviderConfigDto> Handle(UpdateAiSettingsCommand request, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(request.SystemPrompt) && !request.SystemPrompt.Contains("{fields}"))
            throw new InvalidOperationException("El prompt debe contener el placeholder {fields} para los campos de metadatos.");

        var config = await _context.AiProviderConfigs
            .FirstOrDefaultAsync(ct);

        if (config == null)
        {
            config = new AiProviderConfig(request.ApiUrl, request.ApiKey, request.Model, request.MaxTokens, request.SystemPrompt);
            _context.AiProviderConfigs.Add(config);
        }
        else
        {
            config.Update(request.ApiUrl, request.ApiKey, request.Model, request.MaxTokens, request.UpdatedBy, request.SystemPrompt);
        }

        await _context.SaveChangesAsync(ct);

        return new AiProviderConfigDto
        {
            Id = config.Id,
            ApiUrl = config.ApiUrl,
            ApiKey = config.ApiKey,
            Model = config.Model,
            MaxTokens = config.MaxTokens,
            IsActive = config.IsActive,
            SystemPrompt = config.SystemPrompt
        };
    }
}
