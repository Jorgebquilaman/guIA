using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.DocumentMetadata;

public record SetDocumentMetadataCommand(Guid DocumentId, List<SaveMetadataValueDto> Values) : IRequest;

public class SetDocumentMetadataCommandHandler : IRequestHandler<SetDocumentMetadataCommand>
{
    private readonly IAppDbContext _context;

    public SetDocumentMetadataCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(SetDocumentMetadataCommand request, CancellationToken ct)
    {
        var doc = await _context.Documents
            .Include(d => d.MetadataValues)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId, ct);

        if (doc == null)
            throw new KeyNotFoundException($"Document {request.DocumentId} not found.");

        foreach (var existing in doc.MetadataValues.ToList())
            existing.Delete();

        foreach (var input in request.Values)
        {
            var value = new DocumentMetadataValue(
                request.DocumentId,
                input.FieldId,
                input.Value,
                input.RepeatIndex);
            _context.DocumentMetadataValues.Add(value);
        }

        await _context.SaveChangesAsync(ct);
    }
}
