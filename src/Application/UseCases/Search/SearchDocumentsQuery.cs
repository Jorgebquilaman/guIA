using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Application.Ports;
using GuIA.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Search;

public record SearchDocumentsQuery(
    string? TextQuery,
    List<string>? Keywords,
    DocumentType? Type,
    Guid? CollectionId,
    bool PublicOnly,
    int Page,
    int PageSize,
    DateTime? DateFrom,
    DateTime? DateTo,
    string? Author,
    string? DegreeProgram,
    int? Year,
    string? Department
) : IRequest<SearchResultDto>;

public class SearchDocumentsQueryHandler : IRequestHandler<SearchDocumentsQuery, SearchResultDto>
{
    private readonly ISearchPort _searchPort;
    private readonly IAppDbContext _context;

    public SearchDocumentsQueryHandler(ISearchPort searchPort, IAppDbContext context)
    {
        _searchPort = searchPort;
        _context = context;
    }

    public async Task<SearchResultDto> Handle(SearchDocumentsQuery request, CancellationToken ct)
    {
        var searchQuery = new SearchQuery(
            request.TextQuery,
            request.Keywords,
            request.Type,
            request.CollectionId,
            request.PublicOnly,
            request.Page,
            request.PageSize,
            request.DateFrom,
            request.DateTo,
            request.Author,
            request.DegreeProgram,
            request.Year,
            request.Department
        );

        var searchResult = await _searchPort.SearchAsync(searchQuery, ct);

        var documents = await _context.Documents
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .Include(d => d.Keywords)
            .Include(d => d.Collection)
            .Include(d => d.UploadedBy)
            .Include(d => d.AiMetadata)
            .Where(d => searchResult.ItemIds.Contains(d.Id))
            .ToListAsync(ct);

        var docDict = documents.ToDictionary(d => d.Id);

        var items = searchResult.ItemIds
            .Where(id => docDict.ContainsKey(id))
            .Select(id => docDict[id])
            .Select(d => new DocumentDto
            {
                Id = d.Id,
                Title = d.Title,
                Description = d.Description,
                Type = d.Type,
                Status = d.Status,
                CollectionId = d.CollectionId,
                CollectionName = d.Collection?.Name ?? string.Empty,
                UploadedByUserId = d.UploadedByUserId,
                UploadedByUserName = d.UploadedBy?.FullName ?? string.Empty,
                IsPublic = d.IsPublic,
                UploadedAt = d.UploadedAt,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
            PublishedAt = d.PublishedAt,
            HasCoverImage = d.CoverImagePath != null,
            SourceUrl = d.SourceUrl,
            Authors = d.Authors.OrderBy(a => a.Order).Select(a => new DocumentAuthorDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Email = a.Email,
                    Orcid = a.Orcid,
                    Order = a.Order
                }).ToList(),
                Keywords = d.Keywords.Select(k => k.Value).ToList(),
                Files = d.Files.Select(f => new DocumentFileDto
                {
                    Id = f.Id,
                    OriginalFileName = f.OriginalFileName,
                    MimeType = f.MimeType,
                    SizeBytes = f.SizeBytes,
                    HasThumbnail = f.ThumbnailPath != null
                }).ToList(),
                AiMetadata = d.AiMetadata != null ? new AiMetadataDto
                {
                    Summary = d.AiMetadata.Summary,
                    ExtractedEntities = d.AiMetadata.ExtractedEntities,
                    GeneratedDescription = d.AiMetadata.GeneratedDescription,
                    Confidence = d.AiMetadata.Confidence,
                    ProcessedAt = d.AiMetadata.ProcessedAt,
                    ModelVersion = d.AiMetadata.ModelVersion
                } : null,
                AdvisorName = d.AdvisorName,
                Institution = d.Institution,
                PublicationDate = d.PublicationDate,
                AbstractEs = d.AbstractEs,
                License = d.License,
                Department = d.Department,
                DegreeProgram = d.DegreeProgram,
                MediaLinks = (d.MediaLinks ?? []).Select(m => new MediaLinkDto
                {
                    Url = m.Url,
                    Label = m.Label,
                    Type = m.Type
                }).ToList()
            })
            .ToList();

        return new SearchResultDto
        {
            Query = request.TextQuery ?? string.Empty,
            Items = items,
            TotalCount = searchResult.TotalCount,
            Page = searchResult.Page,
            PageSize = searchResult.PageSize
        };
    }
}
