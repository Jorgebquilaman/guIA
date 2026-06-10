using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using GuIA.Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GuIA.Infrastructure.Adapters;

public class AiProcessingWorker : BackgroundService
{
    private readonly AiProcessingQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AiProcessingWorker> _logger;

    public AiProcessingWorker(
        AiProcessingQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<AiProcessingWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AI Processing Worker started.");

        await foreach (var documentId in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            await ProcessDocumentAsync(documentId, stoppingToken);
        }
    }

    private async Task ProcessDocumentAsync(Guid documentId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStoragePort>();
        var llmPort = scope.ServiceProvider.GetRequiredService<ILlmPort>();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        Document? document = null;

        try
        {
            document = await context.Documents
                .Include(d => d.Files)
                .Include(d => d.Authors)
                .Include(d => d.Keywords)
                .Include(d => d.AiMetadata)
                .FirstOrDefaultAsync(d => d.Id == documentId && d.DeletedAt == null, ct);

            if (document == null)
            {
                _logger.LogWarning("Document {DocumentId} not found or deleted. Skipping AI processing.", documentId);
                return;
            }

            if (document.Files.Count == 0)
            {
                _logger.LogWarning("Document {DocumentId} has no files. Skipping AI processing.", documentId);
                return;
            }

            if (document.Status != DocumentStatus.Draft)
            {
                _logger.LogWarning("Document {DocumentId} is not in Draft status ({Status}). Skipping AI processing.", documentId, document.Status);
                return;
            }

            document.MarkAsProcessing();
            await context.SaveChangesAsync(ct);

            var extractedTexts = new List<string>();
            foreach (var file in document.Files)
            {
                try
                {
                    string text = await fileStorage.ExtractTextAsync(file.StoredPath, file.MimeType, ct);
                    if (!string.IsNullOrEmpty(text))
                        extractedTexts.Add(text);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to extract text from file {FileId} ({FileName})", file.Id, file.OriginalFileName);
                }
            }

            if (extractedTexts.Count == 0)
            {
                _logger.LogWarning("No text could be extracted from any file of document {DocumentId}.", documentId);
                document.MarkAsUpdated();
                await context.SaveChangesAsync(ct);
                return;
            }

            string combinedText = string.Join("\n---\n", extractedTexts);
            string fileName = document.Files.First().OriginalFileName;

            var analysis = await llmPort.AnalyzeDocumentAsync(combinedText, fileName, ct);

            var aiMetadata = new AiMetadata
            {
                Id = Guid.NewGuid(),
                Summary = analysis.Summary,
                GeneratedDescription = analysis.Description,
                ExtractedEntities = analysis.ExtractedEntities,
                Confidence = analysis.Confidence > 0 ? analysis.Confidence : null,
                ProcessedAt = DateTime.UtcNow,
                ModelVersion = "claude-v1"
            };

            context.AiMetadata.Add(aiMetadata);
            document.SetAiMetadata(aiMetadata);

            if (analysis.Description != null)
                document.SetDescription(analysis.Description);

            if (document.Keywords.Any())
                document.ClearKeywords();
            foreach (var keywordValue in analysis.Keywords)
            {
                var existingKeyword = await context.Keywords
                    .FirstOrDefaultAsync(k => k.Value == keywordValue.ToLowerInvariant(), ct);
                if (existingKeyword != null)
                {
                    document.AddKeyword(existingKeyword);
                }
                else
                {
                    var newKeyword = new Keyword(keywordValue, KeywordSource.Ai);
                    context.Keywords.Add(newKeyword);
                    document.AddKeyword(newKeyword);
                }
            }

            foreach (var authorName in analysis.Authors)
            {
                if (!document.Authors.Any(a => a.Name == authorName))
                {
                    document.AddAuthor(new DocumentAuthor
                    {
                        Id = Guid.NewGuid(),
                        Name = authorName
                    });
                }
            }

            document.MarkAsUpdated();
            await context.SaveChangesAsync(ct);

            await mediator.Publish(new DocumentAiProcessedEvent(documentId), ct);

            _logger.LogInformation("Successfully processed document {DocumentId} with AI.", documentId);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("AI processing cancelled for document {DocumentId}.", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing document {DocumentId} with AI.", documentId);

            if (document != null)
            {
                try
                {
                    document.MarkAsUpdated();
                    await context.SaveChangesAsync(CancellationToken.None);
                }
                catch (Exception innerEx)
                {
                    _logger.LogError(innerEx, "Failed to save error state for document {DocumentId}.", documentId);
                }
            }
        }
    }
}
