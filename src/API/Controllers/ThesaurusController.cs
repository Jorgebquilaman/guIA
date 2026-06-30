using GuIA.Application.Common;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// ReSharper disable PossibleMultipleEnumeration

namespace GuIA.API.Controllers;

[Route("api/thesaurus/terms")]
[ApiController]
[Authorize(Roles = "Admin")]
public class ThesaurusController : ControllerBase
{
    private readonly IAppDbContext _context;

    public ThesaurusController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var terms = await _context.ThesaurusTerms
            .Include(t => t.ChildThesauri)
            .Include(t => t.ParentThesaurus)
            .OrderBy(t => t.PreferredLabel)
            .ToListAsync(ct);

        var dtos = terms.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var term = await _context.ThesaurusTerms
            .Include(t => t.ChildThesauri)
            .Include(t => t.ParentThesaurus)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (term == null)
            return NotFound(new { message = "Término no encontrado" });

        return Ok(MapToDto(term));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateThesaurusTermRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.PreferredLabel))
            return BadRequest(new { message = "El término preferido es requerido" });

        if (!Enum.TryParse<LanguageCode>(request.Language, out var language))
            return BadRequest(new { message = "Idioma inválido" });

        if (!Enum.TryParse<ThesaurusType>(request.Type, out var type))
            return BadRequest(new { message = "Tipo inválido" });

        ThesaurusTerm? parentThesaurus = null;
        if (request.BroaderTermId.HasValue)
        {
            parentThesaurus = await _context.ThesaurusTerms
                .FirstOrDefaultAsync(t => t.Id == request.BroaderTermId.Value, ct);

            if (parentThesaurus == null)
                return BadRequest(new { message = "Término genérico no encontrado" });
        }

        var term = new ThesaurusTerm(
            request.PreferredLabel.Trim(),
            language,
            type,
            request.AltLabel?.Trim(),
            request.Definition?.Trim(),
            parentThesaurus: parentThesaurus);

        if (request.EffectiveDate.HasValue)
        {
            var effectiveDate = DateTime.SpecifyKind(request.EffectiveDate.Value, DateTimeKind.Utc);
            typeof(ThesaurusTerm).GetProperty(nameof(ThesaurusTerm.EffectiveDate))?.SetValue(term, effectiveDate);
        }

        if (!request.IsActive)
            term.Deactivate();

        _context.ThesaurusTerms.Add(term);
        await _context.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = term.Id }, MapToDto(term));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateThesaurusTermRequest request, CancellationToken ct)
    {
        var term = await _context.ThesaurusTerms
            .Include(t => t.ChildThesauri)
            .Include(t => t.ParentThesaurus)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (term == null)
            return NotFound(new { message = "Término no encontrado" });

        if (string.IsNullOrWhiteSpace(request.PreferredLabel))
            return BadRequest(new { message = "El término preferido es requerido" });

        if (!Enum.TryParse<LanguageCode>(request.Language, out var language))
            return BadRequest(new { message = "Idioma inválido" });

        if (!Enum.TryParse<ThesaurusType>(request.Type, out var type))
            return BadRequest(new { message = "Tipo inválido" });

        // Update basic fields via entity method
        term.Update(
            request.PreferredLabel.Trim(),
            language,
            type,
            request.AltLabel?.Trim(),
            request.Definition?.Trim(),
            broaderTerm: null,
            request.IsActive);

        // Set parent (broader term) via shadow property
        Guid? parentId = request.BroaderTermId;
        if (parentId.HasValue)
        {
            if (parentId.Value == id)
                return BadRequest(new { message = "Un término no puede ser su propio genérico" });

            var parentExists = await _context.ThesaurusTerms
                .AnyAsync(t => t.Id == parentId.Value, ct);

            if (!parentExists)
                return BadRequest(new { message = "Término genérico no encontrado" });
        }

        ((DbContext)_context).Entry(term).Property("ParentThesaurusId").CurrentValue = parentId;

        if (request.EffectiveDate.HasValue)
            typeof(ThesaurusTerm).GetProperty(nameof(ThesaurusTerm.EffectiveDate))?.SetValue(
                term, DateTime.SpecifyKind(request.EffectiveDate.Value, DateTimeKind.Utc));
        if (request.RetirementDate.HasValue)
            typeof(ThesaurusTerm).GetProperty(nameof(ThesaurusTerm.RetirementDate))?.SetValue(
                term, DateTime.SpecifyKind(request.RetirementDate.Value, DateTimeKind.Utc));

        await _context.SaveChangesAsync(ct);

        return Ok(MapToDto(term));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var term = await _context.ThesaurusTerms
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (term == null)
            return NotFound(new { message = "Término no encontrado" });

        // Orphan children: clear parent reference
        var children = await _context.ThesaurusTerms
            .Where(t => EF.Property<Guid?>(t, "ParentThesaurusId") == id)
            .ToListAsync(ct);

        foreach (var child in children)
        {
            ((DbContext)_context).Entry(child).Property("ParentThesaurusId").CurrentValue = null;
        }

        term.Delete();
        await _context.SaveChangesAsync(ct);

        return Ok(new { message = "Término eliminado" });
    }

    private static object MapToDto(ThesaurusTerm term)
    {
        var parentId = typeof(ThesaurusTerm).GetProperty("ParentThesaurusId")?.GetValue(term) as Guid?;

        return new
        {
            id = term.Id,
            preferredLabel = term.PreferredLabel,
            altLabel = term.AltLabel,
            definition = term.Definition,
            language = term.Language.ToString(),
            type = term.Type.ToString(),
            isActive = term.IsActive,
            broaderTerms = term.ParentThesaurus != null
                ? new[] { new { id = term.ParentThesaurus.Id, preferredLabel = term.ParentThesaurus.PreferredLabel } }
                : Array.Empty<object>(),
            narrowerTerms = term.ChildThesauri.Select(c => new
            {
                id = c.Id,
                preferredLabel = c.PreferredLabel
            }).ToList(),
            parentThesaurusId = parentId,
            childThesauri = term.ChildThesauri.Select(c => new
            {
                id = c.Id,
                preferredLabel = c.PreferredLabel
            }).ToList(),
            synonyms = Array.Empty<object>(),
            relatedTerms = Array.Empty<object>(),
            effectiveDate = term.EffectiveDate,
            retirementDate = term.RetirementDate,
            createdAt = term.CreatedAt,
            updatedAt = term.UpdatedAt,
        };
    }
}

public sealed record CreateThesaurusTermRequest(
    string PreferredLabel,
    string? AltLabel,
    string? Definition,
    string Language,
    string Type,
    Guid? BroaderTermId,
    bool IsActive = true,
    DateTime? EffectiveDate = null,
    DateTime? RetirementDate = null);
