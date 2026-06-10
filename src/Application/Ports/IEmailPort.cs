namespace GuIA.Application.Ports;

public interface IEmailPort
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct = default);
}
