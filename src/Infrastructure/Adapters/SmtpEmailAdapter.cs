using System.Net;
using System.Net.Mail;
using GuIA.Application.Common;
using GuIA.Application.Ports;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GuIA.Infrastructure.Adapters;

public class SmtpEmailAdapter : IEmailPort
{
    private readonly IAppDbContext _context;
    private readonly ILogger<SmtpEmailAdapter> _logger;

    public SmtpEmailAdapter(IAppDbContext context, ILogger<SmtpEmailAdapter> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        var config = await _context.SmtpConfigs.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            _logger.LogWarning("SMTP not configured. Skipping email to {To}: {Subject}", to, subject);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(config.FromEmail, config.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        message.To.Add(to);

        using var client = new SmtpClient(config.Host, config.Port)
        {
            Credentials = new NetworkCredential(config.Username, config.Password),
            EnableSsl = config.UseSsl
        };

        await client.SendMailAsync(message, ct);
        _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
    }
}
