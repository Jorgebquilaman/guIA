namespace GuIA.Domain.Entities;

public class AiProviderConfig : BaseEntity
{
    public string ApiUrl { get; private set; }
    public string ApiKey { get; private set; }
    public string Model { get; private set; }
    public int MaxTokens { get; private set; }
    public bool IsActive { get; private set; }
    public string? UpdatedBy { get; private set; }

    private AiProviderConfig() { ApiUrl = null!; ApiKey = null!; Model = null!; }

    public AiProviderConfig(string apiUrl, string apiKey, string model, int maxTokens)
    {
        ApiUrl = apiUrl;
        ApiKey = apiKey;
        Model = model;
        MaxTokens = maxTokens;
        IsActive = true;
    }

    public void Update(string apiUrl, string apiKey, string model, int maxTokens, string? updatedBy = null)
    {
        ApiUrl = apiUrl;
        ApiKey = apiKey;
        Model = model;
        MaxTokens = maxTokens;
        UpdatedBy = updatedBy;
    }

    public void ToggleActive(bool active)
    {
        IsActive = active;
    }
}
