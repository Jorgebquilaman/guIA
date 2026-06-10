using System.Text;
using System.Text.Json;
using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GuIA.Infrastructure.Adapters;

public class DeepSeekLlmAdapter : ILlmPort
{
    private readonly HttpClient _httpClient;
    private readonly IAppDbContext _context;
    private readonly DeepSeekSettings _fallbackSettings;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public DeepSeekLlmAdapter(IHttpClientFactory httpClientFactory, IAppDbContext context, IOptions<DeepSeekSettings> fallbackSettings)
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

        // Use config from DB if available, otherwise fall back to appsettings
        var apiUrl = !string.IsNullOrEmpty(config?.ApiUrl) ? config.ApiUrl : "https://api.deepseek.com/v1/chat/completions";
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
            var systemPrompt = "Eres un asistente experto en metadatos académicos. Analiza el texto del documento proporcionado y extrae la información en formato JSON. " +
                "Devuelve SOLO un objeto JSON válido sin formato adicional ni markdown, con estos campos:\n" +
                "- summary: resumen breve del documento en español (string)\n" +
                "- description: descripción más extensa del contenido (string)\n" +
                "- keywords: array de palabras clave relevantes en español (array of strings, max 10)\n" +
                "- authors: array de nombres de autores detectados en el texto (array of strings)\n" +
                "- extractedEntities: entidades notables encontradas (string, o null)\n" +
                "- confidence: puntaje de confianza entre 0 y 1 (number)";

            var userMessage = $"Analiza el siguiente texto del documento \"{fileName}\":\n\n{extractedText}";

            var requestBody = new
            {
                model,
                max_tokens = maxTokens,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = httpContent;

            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead, ct);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            return ParseResponse(responseJson);
        }
        catch (Exception)
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
        try
        {
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            // OpenAI-compatible response: { choices: [{ message: { content: "..." } }] }
            if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
                return EmptyResult();

            var content = choices[0].GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrEmpty(content))
                return EmptyResult();

            content = content.Trim();
            if (content.StartsWith("```json"))
            {
                var start = content.IndexOf('{');
                var end = content.LastIndexOf('}');
                if (start >= 0 && end >= start)
                    content = content[start..(end + 1)];
            }
            else if (content.StartsWith("```"))
            {
                var start = content.IndexOf('{');
                var end = content.LastIndexOf('}');
                if (start >= 0 && end >= start)
                    content = content[start..(end + 1)];
            }

            var result = JsonSerializer.Deserialize<LlmAnalysisResult>(content, JsonOptions);
            return result ?? EmptyResult();
        }
        catch
        {
            return EmptyResult();
        }
    }

    private static LlmAnalysisResult EmptyResult()
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
