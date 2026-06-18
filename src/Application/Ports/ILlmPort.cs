using GuIA.Domain.ValueObjects;

namespace GuIA.Application.Ports;

public interface ILlmPort
{
    Task<LlmAnalysisResult> AnalyzeDocumentAsync(string extractedText, string fileName, CancellationToken ct = default);

    Task<LlmAnalysisResult> AnalyzeDocumentAsync(string extractedText, string fileName, string[]? metadataFieldLabels, CancellationToken ct = default);
}
