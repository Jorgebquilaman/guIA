using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record GetAiSuggestionsQuery(Guid DocumentId) : IRequest<AiSuggestionsDto?>;

public class GetAiSuggestionsQueryHandler : IRequestHandler<GetAiSuggestionsQuery, AiSuggestionsDto?>
{
    private readonly IAppDbContext _context;
    private readonly IFileStoragePort _fileStorage;
    private readonly ILlmPort _llmPort;

    public GetAiSuggestionsQueryHandler(IAppDbContext context, IFileStoragePort fileStorage, ILlmPort llmPort)
    {
        _context = context;
        _fileStorage = fileStorage;
        _llmPort = llmPort;
    }

    public async Task<AiSuggestionsDto?> Handle(GetAiSuggestionsQuery request, CancellationToken ct)
    {
        var document = await _context.Documents
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .Include(d => d.Keywords)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct);

        if (document == null || document.Files.Count == 0)
            return null;

        var extractedTexts = new List<string>();
        foreach (var file in document.Files)
        {
            try
            {
                var text = await _fileStorage.ExtractTextAsync(file.StoredPath, file.MimeType, ct);
                if (!string.IsNullOrEmpty(text))
                    extractedTexts.Add(text);
            }
            catch
            {
                // skip files that can't be extracted
            }
        }

        if (extractedTexts.Count == 0)
            return null;

        var combinedText = string.Join("\n---\n", extractedTexts);
        var fileName = document.Files.First().OriginalFileName;

        // Guess document type first so we can load schema fields
        var guessedType = GuessDocumentType(fileName, document.Keywords.Select(k => k.Value).ToList());

        // Load metadata schema fields for the guessed document type
        string[]? metadataFieldLabels = null;
        if (guessedType != null)
        {
            var schema = await _context.MetadataSchemas
                .Include(s => s.Fields)
                .FirstOrDefaultAsync(s => s.DocumentTypeName == guessedType && s.IsActive && s.DeletedAt == null, ct);

            if (schema != null)
            {
                metadataFieldLabels = schema.Fields
                    .Where(f => !f.IsHidden && f.Obligatoriness != ObligatorinessLevel.NotApplicable)
                    .OrderBy(f => f.SortOrder)
                    .Select(f =>
                    {
                        var typeHint = f.FieldType switch
                        {
                            FieldType.Text => "texto",
                            FieldType.Textarea => "texto largo",
                            FieldType.Date => "fecha (AAAA-MM-DD)",
                            FieldType.Select => $"opciones: {string.Join(", ", f.Options.Select(o => o.Value))}",
                            FieldType.MultiText => "texto (múltiples valores separados por ;)",
                            _ => "texto"
                        };
                        return $"{f.Label} ({f.InternalName}) — {typeHint}";
                    })
                    .ToArray();
            }
        }

        var analysis = await _llmPort.AnalyzeDocumentAsync(combinedText, fileName, metadataFieldLabels, ct);

        // If the LLM returns low confidence but has metadata values, still accept it
        if (analysis.Confidence <= 0 && analysis.MetadataValues.Count == 0)
            return null;

        return new AiSuggestionsDto
        {
            Title = null,
            Description = analysis.Description,
            AbstractEs = analysis.Summary,
            AbstractEn = analysis.AbstractEn,
            SuggestedKeywords = analysis.Keywords,
            SuggestedKeywordsEn = analysis.KeywordsEn,
            SuggestedAuthors = analysis.Authors.Select((name, i) => new AuthorDto(name, null, null, i + 1)).ToList(),
            SuggestedType = guessedType,
            PublicationVersion = analysis.PublicationVersion,
            DigitalIdentifier = analysis.DigitalIdentifier,
            MetadataValues = analysis.MetadataValues,
        };
    }

    private static string? GuessDocumentType(string fileName, List<string> keywords)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (ext is ".pdf" or ".doc" or ".docx" or ".txt")
        {
            var kw = keywords.Select(k => k.ToLowerInvariant()).ToList();
            if (kw.Any(k => k.Contains("tesis") || k.Contains("thesis") || k.Contains("dissertation")))
                return "Thesis";
            if (kw.Any(k => k.Contains("dataset") || k.Contains("data") || k.Contains("datos")))
                return "Dataset";
            if (kw.Any(k => k.Contains("software") || k.Contains("código") || k.Contains("code")))
                return "Software";
            return "Article";
        }
        return null;
    }
}
