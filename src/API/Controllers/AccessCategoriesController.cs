using GuIA.Application.Common;
using GuIA.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

[Route("api/access-categories")]
[ApiController]
[Authorize]
public class AccessCategoriesController : ControllerBase
{
    private readonly IAppDbContext _context;

    public AccessCategoriesController(IAppDbContext context)
    {
        _context = context;
    }

    /// <summary>Lista pública de categorías activas (para el formulario de solicitar acceso).</summary>
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var items = await _context.AccessCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .Select(c => AccessCategoryDto.FromEntity(c))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var items = await _context.AccessCategories
            .OrderBy(c => c.SortOrder)
            .Select(c => AccessCategoryDto.FromEntity(c))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var category = await _context.AccessCategories
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
            return NotFound(new { message = "Category not found" });

        return Ok(AccessCategoryDto.FromEntity(category));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Create([FromBody] UpsertAccessCategoryRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Name is required" });

        var category = new AccessCategory(
            request.Name.Trim(),
            request.Description?.Trim() ?? string.Empty,
            request.SortOrder);
        if (!request.IsActive)
            category.Update(category.Name, category.Description, category.SortOrder, false);

        _context.AccessCategories.Add(category);
        await _context.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, AccessCategoryDto.FromEntity(category));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertAccessCategoryRequest request, CancellationToken ct)
    {
        var category = await _context.AccessCategories
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
            return NotFound(new { message = "Category not found" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Name is required" });

        category.Update(request.Name.Trim(), request.Description?.Trim() ?? string.Empty, request.SortOrder, request.IsActive);
        await _context.SaveChangesAsync(ct);

        return Ok(AccessCategoryDto.FromEntity(category));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Curator")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var category = await _context.AccessCategories
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
            return NotFound(new { message = "Category not found" });

        _context.AccessCategories.Remove(category);
        await _context.SaveChangesAsync(ct);

        return Ok(new { message = "Category deleted" });
    }
}

public sealed record UpsertAccessCategoryRequest(string Name, string? Description, int SortOrder, bool IsActive = true);

public sealed class AccessCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }

    public static AccessCategoryDto FromEntity(AccessCategory c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        IsActive = c.IsActive,
        SortOrder = c.SortOrder
    };
}
