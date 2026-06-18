using GuIA.Application.Common;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.MetadataFields;

public record FieldOptionInput(string Value, string Label, bool IsDefault, int SortOrder);

public record UpdateFieldOptionsCommand(Guid FieldId, List<FieldOptionInput> Options) : IRequest;

public class UpdateFieldOptionsCommandHandler : IRequestHandler<UpdateFieldOptionsCommand>
{
    private readonly IAppDbContext _context;

    public UpdateFieldOptionsCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateFieldOptionsCommand request, CancellationToken ct)
    {
        var field = await _context.MetadataFields
            .Include(f => f.Options)
            .FirstOrDefaultAsync(f => f.Id == request.FieldId, ct);

        if (field == null)
            throw new KeyNotFoundException($"Metadata field {request.FieldId} not found.");

        foreach (var option in field.Options.ToList())
            option.Delete();

        foreach (var input in request.Options)
        {
            var newOption = new MetadataFieldOption(
                request.FieldId,
                input.Value,
                input.Label,
                input.IsDefault,
                input.SortOrder);
            _context.MetadataFieldOptions.Add(newOption);
        }

        await _context.SaveChangesAsync(ct);
    }
}
