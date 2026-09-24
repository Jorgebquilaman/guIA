using GuIA.Application.Common;
using GuIA.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.MetadataSchemas;

public record CreateMetadataSchemaCommand(
    string DocumentTypeName,
    string Label,
    bool IsActive,
    int SortOrder,
    Guid? CloneFromSchemaId
) : IRequest<Guid>;

public class CreateMetadataSchemaCommandHandler : IRequestHandler<CreateMetadataSchemaCommand, Guid>
{
    private readonly IAppDbContext _context;

    public CreateMetadataSchemaCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateMetadataSchemaCommand request, CancellationToken ct)
    {
        var schema = new MetadataSchema(request.DocumentTypeName, request.Label, request.IsActive, request.SortOrder);
        _context.MetadataSchemas.Add(schema);
        await _context.SaveChangesAsync(ct);

        if (request.CloneFromSchemaId.HasValue)
        {
            var sourceFields = await _context.MetadataFields
                .Include(f => f.Options)
                .Where(f => f.MetadataSchemaId == request.CloneFromSchemaId.Value)
                .OrderBy(f => f.SortOrder)
                .ToListAsync(ct);

            foreach (var src in sourceFields)
            {
                var cloned = new MetadataField(
                    schema.Id,
                    src.DublinCoreElement,
                    src.Qualifier,
                    src.InternalName,
                    src.Label,
                    src.FieldType,
                    src.Obligatoriness,
                    src.IsRepeatable,
                    src.IsReadOnly,
                    src.IsHidden,
                    src.IsSimpleView,
                    src.SortOrder,
                    src.HelpText
                );
                _context.MetadataFields.Add(cloned);
                await _context.SaveChangesAsync(ct);

                if (src.Options.Count > 0)
                {
                    foreach (var opt in src.Options)
                    {
                        _context.MetadataFieldOptions.Add(new MetadataFieldOption(
                            cloned.Id, opt.Value, opt.Label, opt.IsDefault, opt.SortOrder
                        ));
                    }
                }
            }

            await _context.SaveChangesAsync(ct);
        }

        // Auto-sincronización: todo esquema activo debe tener su tipo de documento,
        // así aparece en el combo de carga y resuelve su esquema al catalogar.
        if (request.IsActive)
        {
            var existingDef = await _context.DocumentTypeDefs
                .FirstOrDefaultAsync(t => t.Name == request.DocumentTypeName, ct);

            if (existingDef == null)
            {
                var newDef = new DocumentTypeDef(request.DocumentTypeName, request.Label, 0);
                // vínculo al esquema recién creado
                newDef.Update(request.DocumentTypeName, request.Label, 0, schema.Id);
                _context.DocumentTypeDefs.Add(newDef);
                await _context.SaveChangesAsync(ct);
            }
            else if (existingDef.MetadataSchemaId != schema.Id)
            {
                existingDef.Update(existingDef.Name, existingDef.Label, existingDef.SortOrder, schema.Id);
                await _context.SaveChangesAsync(ct);
            }
        }

        return schema.Id;
    }
}
