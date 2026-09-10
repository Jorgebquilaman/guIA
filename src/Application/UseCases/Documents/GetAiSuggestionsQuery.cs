using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record GetAiSuggestionsQuery(Guid DocumentId, string? SuggestedType = null) : IRequest<AiSuggestionsDto?>;

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
                // Use CancellationToken.None so slow OCR keeps running (and caches its result to .md)
                // even if the HTTP request is aborted by a proxy timeout — the next attempt will hit the cache
                var text = await _fileStorage.ExtractTextAsync(file.StoredPath, file.MimeType, CancellationToken.None);
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
        // Truncate to avoid overwhelming the LLM — 50k chars is enough for metadata extraction
        const int maxTextLength = 50_000;
        if (combinedText.Length > maxTextLength)
            combinedText = combinedText[..maxTextLength] + "\n[... texto truncado ...]";
        var fileName = document.Files.First().OriginalFileName;

        // Guess document type first so we can load schema fields
        var guessedType = GuessDocumentType(fileName, document.Keywords.Select(k => k.Value).ToList());

        // Use the caller-suggested type if provided, otherwise fall back to guessed type
        var effectiveType = request.SuggestedType ?? guessedType;

        // Load metadata schema fields for the effective document type
        string[]? metadataFieldLabels = null;
        Domain.Entities.MetadataSchema? schema = null;
        if (effectiveType != null)
        {
            schema = await _context.MetadataSchemas
                .Include(s => s.Fields)
                    .ThenInclude(f => f.Options)
                .FirstOrDefaultAsync(s => s.DocumentTypeName == effectiveType && s.IsActive && s.DeletedAt == null, ct);

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
                        var guidance = string.IsNullOrWhiteSpace(f.HelpText)
                            ? ""
                            : $" | Guía de catalogación: {f.HelpText}";
                        return $"{f.Label} ({f.InternalName}) — {typeHint}{guidance}";
                    })
                    .ToArray();
            }
        }

        // Tell the LLM the real file page count so it can build dc.format.extent
        // following the field's HelpText guide (RDA 3.4, e.g. "5 p.; 1 PDF; 3 anexos")
        var totalPages = 0;
        foreach (var file in document.Files)
        {
            try
            {
                totalPages += await _fileStorage.GetPdfPageCountAsync(file.StoredPath, CancellationToken.None);
            }
            catch
            {
                // ignore files that can't be opened
            }
        }

        if (totalPages > 0)
        {
            combinedText += $"\n\n[INFORMACIÓN TÉCNICA DEL ARCHIVO] El documento es un archivo PDF de {totalPages} páginas en total. " +
                "Usá exactamente este dato para el campo de extensión (RDA 3.4): no lo deduzcas del texto ni lo inventes.";
        }

        var analysis = await _llmPort.AnalyzeDocumentAsync(combinedText, fileName, metadataFieldLabels, ct);

        // dc.format is machine-generated from the file MIME type (SNRD mimeResolution) —
        // inject it deterministically so the AI never has to guess it
        var formatField = schema?.Fields.FirstOrDefault(f => f.InternalName == "format" && f.FieldType == FieldType.Select);
        if (formatField != null)
        {
            var mimeType = document.Files.First().MimeType;
            if (formatField.Options.Any(o => o.Value == mimeType))
                analysis.MetadataValues["format"] = mimeType;
        }

        // dc.format.extent: the page count comes from the PDF itself, so it is authoritative —
        // always set it with the format defined in the field's HelpText (RDA 3.4: "N p.; 1 PDF")
        var extentField = schema?.Fields.FirstOrDefault(f => f.InternalName == "format_extent");
        if (extentField != null && totalPages > 0)
        {
            analysis.MetadataValues["format_extent"] = $"{totalPages} p.; 1 PDF";
        }

        // If the LLM returned nothing useful, return null
        if (analysis.Confidence <= 0 && analysis.MetadataValues.Count == 0
            && string.IsNullOrWhiteSpace(analysis.Summary)
            && string.IsNullOrWhiteSpace(analysis.Description)
            && analysis.Keywords.Count == 0)
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
            SuggestedType = effectiveType,
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
