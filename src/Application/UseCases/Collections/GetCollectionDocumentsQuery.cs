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
            .Where(d => d.CollectionId == request.CollectionId && d.DeletedAt == null);

        int totalCount = await query.CountAsync(ct);

        var documents = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var items = documents.Select(d => new DocumentDto
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
        }).ToList();

        return new PagedResult<DocumentDto>(items, totalCount, request.Page, request.PageSize);
    }
}
