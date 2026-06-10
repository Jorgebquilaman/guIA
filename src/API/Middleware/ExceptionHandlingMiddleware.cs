using System.Net;
using GuIA.Application.DTOs;
using GuIA.Domain.Exceptions;

namespace GuIA.API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, code, message, details) = exception switch
        {
            DomainValidationException ve => (
                HttpStatusCode.BadRequest,
                "VALIDATION_ERROR",
                ve.Message,
                (string?)null
            ),
            DocumentNotFoundException nf => (
                HttpStatusCode.NotFound,
                "DOCUMENT_NOT_FOUND",
                nf.Message,
                nf.DocumentId.ToString()
            ),
            CollectionNotFoundException nf => (
                HttpStatusCode.NotFound,
                "COLLECTION_NOT_FOUND",
                nf.Message,
                nf.CollectionId.ToString()
            ),
            UserNotFoundException nf => (
                HttpStatusCode.NotFound,
                "USER_NOT_FOUND",
                nf.Message,
                nf.UserId.ToString()
            ),
            UnauthorizedException ua => (
                HttpStatusCode.Forbidden,
                "FORBIDDEN",
                ua.Message,
                (string?)null
            ),
            UnauthorizedAccessException ua => (
                HttpStatusCode.Forbidden,
                "FORBIDDEN",
                ua.Message,
                (string?)null
            ),
            InvalidOperationException io => (
                HttpStatusCode.BadRequest,
                "INVALID_OPERATION",
                io.Message,
                (string?)null
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "INTERNAL_ERROR",
                "An unexpected error occurred.",
                exception.Message
            )
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.Fail(code, message, details);
        await System.Text.Json.JsonSerializer.SerializeAsync(context.Response.Body, response);
    }
}
