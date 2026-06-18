using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace GuIA.Infrastructure.Services;

public interface IGeoIpService
{
    Task<string?> ResolveCountryAsync(string? ipAddress, CancellationToken ct = default);
}

public class GeoIpService : IGeoIpService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GeoIpService> _logger;
    private static readonly HashSet<string> PrivateRanges =
    [
        "127.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
        "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
        "::1", "fe80::", "fc00::",
    ];
    private static readonly HashSet<string> KnownLocal = ["localhost", "::1", "127.0.0.1"];
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public GeoIpService(IHttpClientFactory httpClientFactory, ILogger<GeoIpService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<string?> ResolveCountryAsync(string? ipAddress, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(ipAddress)) return null;

        if (KnownLocal.Contains(ipAddress)) return null;

        foreach (var prefix in PrivateRanges)
            if (ipAddress.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return null;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);

            var response = await client.GetAsync($"http://ip-api.com/json/{ipAddress}?fields=country", ct);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync(ct);
            var result = JsonSerializer.Deserialize<IpApiResponse>(json, JsonOptions);
            return result?.Country;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve country for IP {Ip}", ipAddress);
            return null;
        }
    }

    private sealed class IpApiResponse
    {
        public string? Country { get; set; }
    }
}
