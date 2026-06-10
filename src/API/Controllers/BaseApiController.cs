using GuIA.Application.DTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GuIA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;

    protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected IActionResult Ok<T>(T data) => base.Ok(ApiResponse<T>.Ok(data));

    protected IActionResult BadRequest(string code, string message, string? details = null)
        => base.BadRequest(ApiResponse<object>.Fail(code, message, details));

    protected IActionResult NotFound(string code, string message, string? details = null)
        => base.NotFound(ApiResponse<object>.Fail(code, message, details));

    protected IActionResult Unauthorized(string code, string message, string? details = null)
        => base.Unauthorized(ApiResponse<object>.Fail(code, message, details));

    protected IActionResult Forbid(string code, string message, string? details = null)
        => base.Forbid();
}
