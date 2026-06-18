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
        return await AnalyzeDocumentAsync(extractedText, fileName, null, ct);
    }

    public async Task<LlmAnalysisResult> AnalyzeDocumentAsync(string extractedText, string fileName, string[]? metadataFieldLabels, CancellationToken ct = default)
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
            var defaultPrompt = "Eres un asistente experto en metadatos académicos SNRD (Sistema Nacional de Repositorios Digitales). " +
                "Analiza el texto del documento proporcionado y extraé TODA la información posible en formato JSON. " +
                "Devuelve SOLO un objeto JSON válido sin formato adicional ni markdown.\n\n" +
                "Campos obligatorios del JSON:\n" +
                "- summary: resumen breve del documento en español (string)\n" +
                "- description: descripción más extensa del contenido (string)\n" +
                "- keywords: array de palabras clave relevantes en español (array of strings, máx 10)\n" +
                "- keywordsEn: array de keywords in English if present in the text (array of strings, max 10)\n" +
                "- authors: array de nombres de autores en formato AACR2: \"Apellido, Nombre\". Si hay múltiples autores, cada uno es un elemento del array. NO incluir \" y \" entre nombres. (array of strings)\n" +
                "- abstractEn: English abstract if present in the text (string, or null)\n" +
                "- publicationVersion: versión de la publicación, ej: \"acceptedVersion\", \"publishedVersion\", \"updatedVersion\" (string, or null)\n" +
                "- digitalIdentifier: identificador digital único, ej: DOI, URI, Handle (string, or null)\n" +
                "- extractedEntities: entidades notables encontradas como personas, instituciones, lugares (string, or null)\n" +
                "- confidence: puntaje de confianza entre 0 y 1 (number)\n\n" +
                "Reglas AACR2 obligatorias para autores:\n" +
                "- Formato: \"Apellido, Nombre\" (ej: \"García, María\")\n" +
                "- Si hay más de un autor, cada uno va como elemento separado del array authors\n" +
                "- NO usar \" y \" para unir autores, cada autor es un string independiente en el array\n" +
                "Otras reglas de formato:\n" +
                "- Subtítulos separados del título con ' : ' (espacio-dos puntos-espacio)\n" +
                "- Páginas: usar 'p. ' seguido del rango. Ej: 'p. 45-56'\n" +
                "- Fechas: AAAA-MM-DD (ISO 8601)\n" +
                "- Filiación: 'Fil: Apellido, Nombre. Institución mayor. Dependencia; País.'\n" +
                "{fields}";

            var promptTemplate = !string.IsNullOrEmpty(config?.SystemPrompt) ? config.SystemPrompt : defaultPrompt;

            var fieldsBlock = "";
            if (metadataFieldLabels is { Length: > 0 })
            {
                var fieldsList = string.Join("\n", metadataFieldLabels.Select((f, i) => $"  \"{f}\": \"<valor extraído>\""));

                fieldsBlock = $"\n\nAdemás, incluí un objeto \"metadataValues\" en el JSON con TODOS los siguientes campos que puedas identificar en el texto. " +
                    $"Las claves DEBEN ser exactamente los textos en paréntesis. Para campos de tipo Select, usá UNO de los valores de opción indicados. " +
                    $"Para campos MultiText con múltiples valores, separalos con \" ; \". " +
                    $"Para campos de fecha, usá formato AAAA-MM-DD o NO LO INCLUYAS si no hay fecha. " +
                    $"NO uses placeholders como \"No detectado\", \"N/A\" ni cadenas vacías; omití el campo si no hay dato real. " +
                    $"Completá la mayor cantidad posible:\n{fieldsList}";
            }

            var systemPrompt = promptTemplate.Replace("{fields}", fieldsBlock);

            systemPrompt += "\n\nDevuelve SOLO un objeto JSON válido sin formato adicional ni markdown. No incluyas bloques ```json ni explicaciones.";

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
                Confidence = 0.0,
                MetadataValues = new Dictionary<string, string>(),
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
                Confidence = 0.0,
                MetadataValues = new Dictionary<string, string>(),
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
                Confidence = 0.0,
                MetadataValues = new Dictionary<string, string>(),
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
                Confidence = 0.0,
                MetadataValues = new Dictionary<string, string>(),
            };
        }
    }
}
