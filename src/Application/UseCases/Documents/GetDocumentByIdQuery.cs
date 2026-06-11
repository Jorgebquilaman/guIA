using GuIA.Application.Common;
using GuIA.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Documents;

public record GetDocumentByIdQuery(Guid DocumentId) : IRequest<DocumentDto>;

public class GetDocumentByIdQueryHandler : IRequestHandler<GetDocumentByIdQuery, DocumentDto>
{
    private readonly IAppDbContext _context;

    public GetDocumentByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DocumentDto> Handle(GetDocumentByIdQuery request, CancellationToken ct)
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

        return new DocumentDto
        {
            Id = document.Id,
            Title = document.Title,
            Description = document.Description,
            Type = document.Type,
            Status = document.Status,
            CollectionId = document.CollectionId,
            CollectionName = document.Collection?.Name ?? string.Empty,
            UploadedByUserId = document.UploadedByUserId,
            UploadedByUserName = document.UploadedBy?.FullName ?? string.Empty,
            IsPublic = document.IsPublic,
            UploadedAt = document.UploadedAt,
            CreatedAt = document.CreatedAt,
            UpdatedAt = document.UpdatedAt,
            PublishedAt = document.PublishedAt,
            HasCoverImage = document.CoverImagePath != null,
            SourceUrl = document.SourceUrl,
            Authors = document.Authors.OrderBy(a => a.Order).Select(a => new DocumentAuthorDto
            {
                Id = a.Id,
                Name = a.Name,
                Email = a.Email,
                Orcid = a.Orcid,
                Order = a.Order
            }).ToList(),
            Keywords = document.Keywords.Select(k => k.Value).ToList(),
            Files = document.Files.Select(f => new DocumentFileDto
            {
                Id = f.Id,
                OriginalFileName = f.OriginalFileName,
                MimeType = f.MimeType,
                SizeBytes = f.SizeBytes,
                HasThumbnail = f.ThumbnailPath != null
            }).ToList(),
            AiMetadata = document.AiMetadata != null ? new AiMetadataDto
            {
                Summary = document.AiMetadata.Summary,
                ExtractedEntities = document.AiMetadata.ExtractedEntities,
                GeneratedDescription = document.AiMetadata.GeneratedDescription,
                Confidence = document.AiMetadata.Confidence,
                ProcessedAt = document.AiMetadata.ProcessedAt,
                ModelVersion = document.AiMetadata.ModelVersion
            } : null,
            AdvisorName = document.AdvisorName,
            Institution = document.Institution,
            PublicationDate = document.PublicationDate,
            AbstractEs = document.AbstractEs,
            License = document.License,
            Department = document.Department,
            DegreeProgram = document.DegreeProgram
        };
    }
}
