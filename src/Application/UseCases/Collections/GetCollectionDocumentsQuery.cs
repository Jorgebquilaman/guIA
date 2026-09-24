using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Collections;

public record GetCollectionDocumentsQuery(Guid CollectionId, int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<DocumentDto>>;

public class GetCollectionDocumentsQueryHandler
    : IRequestHandler<GetCollectionDocumentsQuery, PagedResult<DocumentDto>>
{
    private readonly IAppDbContext _context;

    public GetCollectionDocumentsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<DocumentDto>> Handle(
        GetCollectionDocumentsQuery request, CancellationToken ct)
    {
        var query = _context.Documents
            .Include(d => d.Files)
            .Include(d => d.Authors)
            .Include(d => d.Keywords)
            .Include(d => d.Collection)
            .Include(d => d.UploadedBy)
            .Include(d => d.AiMetadata)
            .Include(d => d.DocumentType_)
            .Where(d => d.CollectionId == request.CollectionId && d.DeletedAt == null);

        int totalCount = await query.CountAsync(ct);

        var documents = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var defsByName = (await _context.DocumentTypeDefs
            .Select(t => new { t.Name })
            .ToListAsync(ct))
            .ToDictionary(t => t.Name, t => t.Name);

        var collectionNames = await _context.Collections
            .IgnoreQueryFilters()
            .Where(c => documents.Select(d => d.CollectionId).Distinct().Contains(c.Id))
            .Select(c => new { c.Id, c.Name })
            .ToDictionaryAsync(c => c.Id, c => c.Name, ct);

        string? ResolveTypeName(Domain.Entities.Document d)
            => d.DocumentType_?.Name
               ?? (defsByName.TryGetValue(d.Type.ToString(), out var name) ? name : null);

        string ResolveCollectionName(Domain.Entities.Document d)
            => collectionNames.TryGetValue(d.CollectionId, out var collectionName) ? collectionName : string.Empty;

        var items = documents.Select(d => new DocumentDto
        {
            Id = d.Id,
            Title = d.Title,
            Description = d.Description,
            Type = d.Type,
            DocumentTypeId = d.DocumentTypeId,
            DocumentTypeName = ResolveTypeName(d),
            Status = d.Status,
            CollectionId = d.CollectionId,
            CollectionName = ResolveCollectionName(d),
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
        }).ToList();

        return new PagedResult<DocumentDto>(items, totalCount, request.Page, request.PageSize);
    }
}
