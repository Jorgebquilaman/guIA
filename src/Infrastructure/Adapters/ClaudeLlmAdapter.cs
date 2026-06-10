using System.Text;
using System.Text.Json;
using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GuIA.Infrastructure.Adapters;

public class ClaudeLlmAdapter : ILlmPort
{
    private readonly HttpClient _httpClient;
    private readonly IAppDbContext _context;
    private readonly AnthropicSettings _fallbackSettings;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ClaudeLlmAdapter(IHttpClientFactory httpClientFactory, IAppDbContext context, IOptions<AnthropicSettings> fallbackSettings)
    {
        _httpClient = httpClientFactory.CreateClient();
        _context = context;
        _fallbackSettings = fallbackSettings.Value;
    }

    public async Task<LlmAnalysisResult> AnalyzeDocumentAsync(string extractedText, string fileName, CancellationToken ct = default)
    {
        var config = await _context.AiProviderConfigs
            .Where(c => c.IsActive)
            .FirstOrDefaultAsync(ct);

        var apiUrl = config?.ApiUrl ?? "https://api.anthropic.com/v1/messages";
        var apiKey = config?.ApiKey ?? _fallbackSettings.ApiKey;
        var model = config?.Model ?? _fallbackSettings.Model;
        var maxTokens = config?.MaxTokens ?? _fallbackSettings.MaxTokens;

        if (string.IsNullOrEmpty(apiKey))
        {
            return new LlmAnalysisResult
            {
                Summary = null,
                Keywords = new List<string>(),
                Authors = new List<string>(),
                Description = null,
                ExtractedEntities = null,
                Confidence = 0.0
            };
        }

        try
        {
            var systemPrompt = "You are a document analysis assistant. Analyze the provided document text and return a JSON object " +
                "with the following fields:\n" +
                "- summary: a concise summary of the document (string)\n" +
                "- description: a longer generated description of the document (string)\n" +
                "- keywords: an array of relevant keywords (array of strings)\n" +
                "- authors: an array of detected author names (array of strings)\n" +
                "- extractedEntities: any notable entities found (string, or null)\n" +
                "- confidence: a confidence score between 0 and 1 (number)\n\n" +
                "Return ONLY valid JSON without any additional text or markdown formatting.";

            var userMessage = $"Analyze the following document text from file \"{fileName}\":\n\n{extractedText}";

            var requestBody = new
            {
                model,
                max_tokens = maxTokens,
                system = systemPrompt,
                messages = new[]
                {
                    new { role = "user", content = userMessage }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
            request.Content = httpContent;

            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead, ct);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            return ParseResponse(responseJson);
        }
        catch (Exception ex)
        {
            return new LlmAnalysisResult
            {
                Summary = null,
                Keywords = new List<string>(),
                Authors = new List<string>(),
                Description = null,
                ExtractedEntities = null,
                Confidence = 0.0
            };
        }
    }

    private static LlmAnalysisResult ParseResponse(string responseJson)
    {
        using var doc = JsonDocument.Parse(responseJson);
        var root = doc.RootElement;

        var contentArray = root.GetProperty("content");
        var textContent = string.Empty;
        foreach (var item in contentArray.EnumerateArray())
        {
            if (item.GetProperty("type").GetString() == "text")
            {
                textContent = item.GetProperty("text").GetString() ?? string.Empty;
                break;
            }
        }

        if (string.IsNullOrEmpty(textContent))
            return new LlmAnalysisResult
            {
                Summary = null,
                Keywords = new List<string>(),
                Authors = new List<string>(),
                Description = null,
                ExtractedEntities = null,
                Confidence = 0.0
            };

        textContent = textContent.Trim();
        if (textContent.StartsWith("```json"))
        {
            var start = textContent.IndexOf('{');
            var end = textContent.LastIndexOf('}');
            if (start >= 0 && end >= start)
                textContent = textContent[start..(end + 1)];
        }
        else if (textContent.StartsWith("```"))
        {
            var start = textContent.IndexOf('{');
            var end = textContent.LastIndexOf('}');
            if (start >= 0 && end >= start)
                textContent = textContent[start..(end + 1)];
        }

        try
        {
            var result = JsonSerializer.Deserialize<LlmAnalysisResult>(textContent, JsonOptions);
            return result ?? new LlmAnalysisResult
            {
                Summary = null,
                Keywords = new List<string>(),
                Authors = new List<string>(),
                Description = null,
                ExtractedEntities = null,
                Confidence = 0.0
            };
        }
        catch
        {
            return new LlmAnalysisResult
            {
                Summary = textContent.Length > 500 ? textContent[..500] : textContent,
                Keywords = new List<string>(),
                Authors = new List<string>(),
                Description = null,
                ExtractedEntities = null,
                Confidence = 0.0
            };
        }
    }
}
