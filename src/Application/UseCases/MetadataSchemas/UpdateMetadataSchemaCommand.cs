using GuIA.Application.Common;
using MediatR;

namespace GuIA.Application.UseCases.MetadataSchemas;

public record UpdateMetadataSchemaCommand(Guid Id, string Label, bool IsActive, int SortOrder) : IRequest;

public class UpdateMetadataSchemaCommandHandler : IRequestHandler<UpdateMetadataSchemaCommand>
{
    private readonly IAppDbContext _context;

    public UpdateMetadataSchemaCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateMetadataSchemaCommand request, CancellationToken ct)
    {
        var schema = await _context.MetadataSchemas.FindAsync(new object[] { request.Id }, ct);
        if (schema == null)
            throw new KeyNotFoundException($"Metadata schema with id {request.Id} not found.");

        schema.Update(request.Label, request.IsActive, request.SortOrder);
        await _context.SaveChangesAsync(ct);
    }
}
