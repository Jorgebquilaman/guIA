using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.MetadataFields;

public record DeleteMetadataFieldCommand(Guid Id) : IRequest;

public class DeleteMetadataFieldCommandHandler : IRequestHandler<DeleteMetadataFieldCommand>
{
    private readonly IAppDbContext _context;

    public DeleteMetadataFieldCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteMetadataFieldCommand request, CancellationToken ct)
    {
        var field = await _context.MetadataFields
            .Include(f => f.Options)
            .FirstOrDefaultAsync(f => f.Id == request.Id, ct);

        if (field == null)
            throw new KeyNotFoundException($"Metadata field {request.Id} not found.");

        var hasValues = await _context.DocumentMetadataValues
            .AnyAsync(v => v.MetadataFieldId == request.Id, ct);

        if (hasValues)
            throw new InvalidOperationException("Cannot delete a field that has values in documents.");

        field.Delete();
        await _context.SaveChangesAsync(ct);
    }
}
