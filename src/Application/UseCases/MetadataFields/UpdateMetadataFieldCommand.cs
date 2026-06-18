using GuIA.Application.Common;
using GuIA.Domain.Enums;
using MediatR;

namespace GuIA.Application.UseCases.MetadataFields;

public record UpdateMetadataFieldCommand(
    Guid Id,
    string Label,
    bool IsRequired,
    string Obligatoriness,
    int SortOrder,
    bool IsHidden,
    string? HelpText
) : IRequest;

public class UpdateMetadataFieldCommandHandler : IRequestHandler<UpdateMetadataFieldCommand>
{
    private readonly IAppDbContext _context;

    public UpdateMetadataFieldCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateMetadataFieldCommand request, CancellationToken ct)
    {
        var field = await _context.MetadataFields.FindAsync(new object[] { request.Id }, ct);
        if (field == null)
            throw new KeyNotFoundException($"Metadata field {request.Id} not found.");

        if (!Enum.TryParse<ObligatorinessLevel>(request.Obligatoriness, true, out var obligatoriness))
            throw new ArgumentException($"Invalid obligatoriness: {request.Obligatoriness}");

        field.Update(request.Label, request.IsRequired, obligatoriness, request.SortOrder, request.IsHidden, request.HelpText);
        await _context.SaveChangesAsync(ct);
    }
}
