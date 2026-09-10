using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.MetadataSchemas;

public record DeleteMetadataSchemaCommand(Guid Id, bool Force = false) : IRequest;

public class DeleteMetadataSchemaCommandHandler : IRequestHandler<DeleteMetadataSchemaCommand>
{
    private readonly IAppDbContext _context;

    public DeleteMetadataSchemaCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteMetadataSchemaCommand request, CancellationToken ct)
    {
        var schema = await _context.MetadataSchemas
            .Include(s => s.Fields)
            .ThenInclude(f => f.Options)
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct);

        if (schema == null)
            throw new KeyNotFoundException($"Metadata schema {request.Id} not found.");

        var fieldIds = schema.Fields.Select(f => f.Id).ToList();

        var hasValues = await _context.DocumentMetadataValues
            .AnyAsync(v => fieldIds.Contains(v.MetadataFieldId), ct);

        if (hasValues && !request.Force)
            throw new InvalidOperationException("Cannot delete a schema that has fields with values in documents. Use force to delete them too.");

        if (hasValues)
        {
            var values = await _context.DocumentMetadataValues
                .Where(v => fieldIds.Contains(v.MetadataFieldId))
                .ToListAsync(ct);

            _context.DocumentMetadataValues.RemoveRange(values);
        }

        schema.Delete();
        await _context.SaveChangesAsync(ct);
    }
}
