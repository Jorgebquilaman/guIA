namespace GuIA.Application.DTOs;

public class AiProviderConfigDto
{
    public Guid Id { get; set; }
    public string ApiUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int MaxTokens { get; set; }
    public bool IsActive { get; set; }
    public string? SystemPrompt { get; set; }
}
