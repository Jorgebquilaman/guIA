namespace GuIA.Infrastructure.Adapters;

public class DeepSeekSettings
{
    public const string SectionName = "DeepSeek";

    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "deepseek-chat";
    public int MaxTokens { get; set; } = 4096;
}
