namespace GuIA.Application.DTOs;

public class SiteConfigDto
{
    public Guid Id { get; set; }
    public bool ShowMessage { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
}
