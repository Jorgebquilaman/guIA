using GuIA.Application.Ports;
using Microsoft.Extensions.Logging;

namespace GuIA.Infrastructure.Adapters;

public class NullEmailAdapter : IEmailPort
{
    private readonly ILogger<NullEmailAdapter> _logger;

    public NullEmailAdapter(ILogger<NullEmailAdapter> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("Email not sent (null adapter): To={To}, Subject={Subject}, BodyLength={Length}",
            to, subject, body?.Length ?? 0);
        return Task.CompletedTask;
    }
}
