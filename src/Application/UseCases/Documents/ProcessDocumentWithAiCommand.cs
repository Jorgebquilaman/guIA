using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record ProcessDocumentWithAiCommand(Guid DocumentId) : IRequest<DocumentDto>;

public class ProcessDocumentWithAiCommandHandler : IRequestHandler<ProcessDocumentWithAiCommand, DocumentDto>
{
    private readonly IAppDbContext _context;
    private readonly IFileStoragePort _fileStorage;
    private readonly ILlmPort _llmPort;

    public ProcessDocumentWithAiCommandHandler(
        IAppDbContext context,
        IFileStoragePort fileStorage,
        ILlmPort llmPort)
    {
        _context = context;
        _fileStorage = fileStorage;
        _llmPort = llmPort;
    }

    public async Task<DocumentDto> Handle(ProcessDocumentWithAiCommand request, CancellationToken ct)
    {
        var document = await _context.Documents
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .Include(d => d.Keywords)
            .Include(d => d.Collection)
            .Include(d => d.UploadedBy)
            .Include(d => d.AiMetadata)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.DeletedAt == null, ct)
            ?? throw new InvalidOperationException($"Document {request.DocumentId} not found.");

        if (document.Files.Count == 0)
            throw new InvalidOperationException("Document has no files to process.");

        try
        {
            document.MarkAsProcessing();
            await _context.SaveChangesAsync(ct);

            var extractedTexts = new List<string>();
            foreach (var file in document.Files)
            {
                string text = await _fileStorage.ExtractTextAsync(file.StoredPath, file.MimeType, ct);
                extractedTexts.Add(text);
            }

            string combinedText = string.Join("\n---\n", extractedTexts);
            string fileName = document.Files.First().OriginalFileName;
            var analysis = await _llmPort.AnalyzeDocumentAsync(combinedText, fileName, ct);

            var aiMetadata = new AiMetadata
            {
                Id = Guid.NewGuid(),
                Summary = analysis.Summary,
                GeneratedDescription = analysis.Description,
                ExtractedEntities = analysis.ExtractedEntities,
                Confidence = analysis.Confidence,
                ProcessedAt = DateTime.UtcNow,
                ModelVersion = "v1"
            };

            _context.AiMetadata.Add(aiMetadata);
            document.SetAiMetadata(aiMetadata);

            if (analysis.Description != null)
                document.SetDescription(analysis.Description);

            document.ClearKeywords();
            foreach (var keywordValue in analysis.Keywords)
            {
                var existingKeyword = await _context.Keywords
                    .FirstOrDefaultAsync(k => k.Value == keywordValue.ToLowerInvariant(), ct);
                if (existingKeyword != null)
                {
                    document.AddKeyword(existingKeyword);
                }
                else
                {
                    var newKeyword = new Keyword(keywordValue, KeywordSource.Ai);
                    _context.Keywords.Add(newKeyword);
                    document.AddKeyword(newKeyword);
                }
            }

            foreach (var authorName in analysis.Authors)
            {
                if (!document.Authors.Any(a => a.Name == authorName))
                {
                    var nextOrder = document.Authors.Any() ? document.Authors.Max(a => a.Order) + 1 : 1;
                    document.AddAuthor(new DocumentAuthor
                    {
                        Id = Guid.NewGuid(),
                        Name = authorName,
                        Order = nextOrder
                    });
                }
            }

            document.Publish(DateTime.UtcNow);
        }
        catch (Exception)
        {
            document.MarkAsUpdated();
            await _context.SaveChangesAsync(ct);
            throw;
        }

        await _context.SaveChangesAsync(ct);

        return MapToDto(document);
    }

    private static DocumentDto MapToDto(Document doc)
    {
        return new DocumentDto
        {
            Id = doc.Id,
            Title = doc.Title,
            Description = doc.Description,
            Type = doc.Type,
            Status = doc.Status,
            CollectionId = doc.CollectionId,
            CollectionName = doc.Collection?.Name ?? string.Empty,
            UploadedByUserId = doc.UploadedByUserId,
            UploadedByUserName = doc.UploadedBy?.FullName ?? string.Empty,
            IsPublic = doc.IsPublic,
            UploadedAt = doc.UploadedAt,
            CreatedAt = doc.CreatedAt,
            UpdatedAt = doc.UpdatedAt,
            PublishedAt = doc.PublishedAt,
            HasCoverImage = doc.CoverImagePath != null,
            Authors = doc.Authors.OrderBy(a => a.Order).Select(a => new DocumentAuthorDto
            {
                Id = a.Id,
                Name = a.Name,
                Email = a.Email,
                Orcid = a.Orcid,
                Order = a.Order
            }).ToList(),
            Keywords = doc.Keywords.Select(k => k.Value).ToList(),
            Files = doc.Files.Select(f => new DocumentFileDto
            {
                Id = f.Id,
                OriginalFileName = f.OriginalFileName,
                MimeType = f.MimeType,
                SizeBytes = f.SizeBytes,
                HasThumbnail = f.ThumbnailPath != null
            }).ToList(),
            AiMetadata = doc.AiMetadata != null ? new AiMetadataDto
            {
                Summary = doc.AiMetadata.Summary,
                ExtractedEntities = doc.AiMetadata.ExtractedEntities,
                GeneratedDescription = doc.AiMetadata.GeneratedDescription,
                Confidence = doc.AiMetadata.Confidence,
                ProcessedAt = doc.AiMetadata.ProcessedAt,
                ModelVersion = doc.AiMetadata.ModelVersion
            } : null,
            AdvisorName = doc.AdvisorName,
            Institution = doc.Institution,
            PublicationDate = doc.PublicationDate,
            AbstractEs = doc.AbstractEs,
            License = doc.License,
            Department = doc.Department,
            DegreeProgram = doc.DegreeProgram
        };
    }
}
