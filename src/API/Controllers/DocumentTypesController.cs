using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

[Route("api/document-types")]
[ApiController]
[Authorize]
public class DocumentTypesController : ControllerBase
{
    private readonly IAppDbContext _context;

    public DocumentTypesController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var types = await _context.DocumentTypeDefs
            .OrderBy(t => t.SortOrder)
            .Select(t => DocumentTypeDefDto.FromEntity(t))
            .ToListAsync(ct);

        return Ok(types);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var type = await _context.DocumentTypeDefs
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (type == null)
            return NotFound(new { message = "Type not found" });

        return Ok(DocumentTypeDefDto.FromEntity(type));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateDocumentTypeRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Label))
            return BadRequest(new { message = "Name and label are required" });

        var exists = await _context.DocumentTypeDefs
            .AnyAsync(t => t.Name == request.Name, ct);

        if (exists)
            return BadRequest(new { message = "A type with this name already exists" });

        var type = new DocumentTypeDef(request.Name, request.Label, request.SortOrder);
        _context.DocumentTypeDefs.Add(type);
        await _context.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = type.Id }, DocumentTypeDefDto.FromEntity(type));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateDocumentTypeRequest request, CancellationToken ct)
    {
        var type = await _context.DocumentTypeDefs
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (type == null)
            return NotFound(new { message = "Type not found" });

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Label))
            return BadRequest(new { message = "Name and label are required" });

        var duplicate = await _context.DocumentTypeDefs
            .AnyAsync(t => t.Name == request.Name && t.Id != id, ct);

        if (duplicate)
            return BadRequest(new { message = "A type with this name already exists" });

        type.Update(request.Name, request.Label, request.SortOrder);
        await _context.SaveChangesAsync(ct);

        return Ok(DocumentTypeDefDto.FromEntity(type));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var type = await _context.DocumentTypeDefs
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (type == null)
            return NotFound(new { message = "Type not found" });

        _context.DocumentTypeDefs.Remove(type);
        await _context.SaveChangesAsync(ct);

        return Ok(new { message = "Type deleted" });
    }
}

public sealed record CreateDocumentTypeRequest(string Name, string Label, int SortOrder);
