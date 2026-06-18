namespace GuIA.Domain.Entities;

public class AiProviderConfig : BaseEntity
{
    public string ApiUrl { get; private set; }
    public string ApiKey { get; private set; }
    public string Model { get; private set; }
    public int MaxTokens { get; private set; }
    public bool IsActive { get; private set; }
    public string? UpdatedBy { get; private set; }
    public string? SystemPrompt { get; private set; }

    private AiProviderConfig() { ApiUrl = null!; ApiKey = null!; Model = null!; }

    public AiProviderConfig(string apiUrl, string apiKey, string model, int maxTokens, string? systemPrompt = null)
    {
        ApiUrl = apiUrl;
        ApiKey = apiKey;
        Model = model;
        MaxTokens = maxTokens;
        SystemPrompt = systemPrompt;
        IsActive = true;
    }

    public void Update(string apiUrl, string apiKey, string model, int maxTokens, string? updatedBy = null, string? systemPrompt = null)
    {
        ApiUrl = apiUrl;
        ApiKey = apiKey;
        Model = model;
        MaxTokens = maxTokens;
        UpdatedBy = updatedBy;
        SystemPrompt = systemPrompt;
    }

    public void ToggleActive(bool active)
    {
        IsActive = active;
    }
}
