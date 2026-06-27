using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

[Route("api/departments")]
[ApiController]
public class DepartmentsController : ControllerBase
{
    private readonly IAppDbContext _context;

    public DepartmentsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var departments = await _context.Departments
            .Include(d => d.DegreePrograms)
            .OrderBy(d => d.Name)
            .Select(d => DepartmentDto.FromEntity(d))
            .ToListAsync(ct);

        return Ok(departments);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var department = await _context.Departments
            .Include(d => d.DegreePrograms)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (department == null)
            return NotFound(new { message = "Departamento no encontrado" });

        return Ok(DepartmentDto.FromEntity(department));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "El nombre del departamento es requerido" });

        var exists = await _context.Departments
            .AnyAsync(d => d.Name == request.Name, ct);

        if (exists)
            return BadRequest(new { message = "Ya existe un departamento con ese nombre" });

        var department = new Department(request.Name, request.Color ?? "#1B4D3E", request.Icon);
        _context.Departments.Add(department);

        if (request.DegreePrograms != null)
        {
            foreach (var progName in request.DegreePrograms)
            {
                if (!string.IsNullOrWhiteSpace(progName))
                    department.AddDegreeProgram(progName.Trim());
            }
        }

        await _context.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = department.Id }, DepartmentDto.FromEntity(department));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateDepartmentRequest request, CancellationToken ct)
    {
        var department = await _context.Departments
            .Include(d => d.DegreePrograms)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (department == null)
            return NotFound(new { message = "Departamento no encontrado" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "El nombre del departamento es requerido" });

        var duplicate = await _context.Departments
            .AnyAsync(d => d.Name == request.Name && d.Id != id, ct);

        if (duplicate)
            return BadRequest(new { message = "Ya existe un departamento con ese nombre" });

        department.Update(request.Name, request.Color ?? "#1B4D3E", request.Icon);

        // Sync degree programs via explicit DbSet operations
        var incomingNames = request.DegreePrograms?
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .ToHashSet() ?? new HashSet<string>();

        // Soft-delete programs no longer in the list
        foreach (var program in department.DegreePrograms.ToList())
        {
            if (!incomingNames.Contains(program.Name))
            {
                _context.DegreePrograms.Remove(program);
            }
        }

        // Add new programs
        var existingNames = department.DegreePrograms.Select(p => p.Name).ToHashSet();
        foreach (var name in incomingNames)
        {
            if (!existingNames.Contains(name))
            {
                var program = new DegreeProgram(name);
                program.SetDepartmentId(department.Id);
                _context.DegreePrograms.Add(program);
            }
        }

        await _context.SaveChangesAsync(ct);

        return Ok(DepartmentDto.FromEntity(department));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (department == null)
            return NotFound(new { message = "Departamento no encontrado" });

        department.Delete();
        await _context.SaveChangesAsync(ct);

        return Ok(new { message = "Departamento eliminado" });
    }

    [HttpPost("{id:guid}/degree-programs")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddDegreeProgram(Guid id, [FromBody] AddDegreeProgramRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "El nombre de la carrera es requerido" });

        var department = await _context.Departments
            .Include(d => d.DegreePrograms)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (department == null)
            return NotFound(new { message = "Departamento no encontrado" });

        department.AddDegreeProgram(request.Name.Trim());
        await _context.SaveChangesAsync(ct);

        return Ok(DepartmentDto.FromEntity(department));
    }

    [HttpDelete("{id:guid}/degree-programs/{programId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveDegreeProgram(Guid id, Guid programId, CancellationToken ct)
    {
        var department = await _context.Departments
            .Include(d => d.DegreePrograms)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (department == null)
            return NotFound(new { message = "Departamento no encontrado" });

        var program = department.DegreePrograms.FirstOrDefault(p => p.Id == programId);
        if (program == null)
            return NotFound(new { message = "Carrera no encontrada" });

        department.RemoveDegreeProgram(program);
        await _context.SaveChangesAsync(ct);

        return Ok(DepartmentDto.FromEntity(department));
    }
}

public sealed record CreateDepartmentRequest(string Name, string? Color, string? Icon, List<string>? DegreePrograms);
public sealed record AddDegreeProgramRequest(string Name);
