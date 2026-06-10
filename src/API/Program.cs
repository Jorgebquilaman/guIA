using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using FluentValidation.AspNetCore;
using GuIA.API.Extensions;
using GuIA.API.Middleware;
using GuIA.API.Services;
using GuIA.Application;
using GuIA.Application.Common;
using GuIA.Domain.Entities;
using GuIA.Domain.ValueObjects;
using GuIA.Infrastructure;
using GuIA.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, cfg) =>
    cfg.ReadFrom.Configuration(context.Configuration));

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService>(sp =>
{
    var httpContext = sp.GetRequiredService<IHttpContextAccessor>().HttpContext;
    var principal = httpContext?.User;
    return new CurrentUserService(principal);
});

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddSwaggerWithJwt();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowOrigins", policy =>
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<GuIA.Application.UseCases.Validators.LoginValidator>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = (DbContext)scope.ServiceProvider.GetRequiredService<IAppDbContext>();
    dbContext.Database.EnsureCreated();

    if (!await dbContext.Set<User>().AnyAsync())
    {
        var adminEmail = new Email("admin@guia.app");
        var adminPassword = PasswordHelper.Hash("Admin123!");
        var admin = new User(adminEmail, adminPassword, "Administrador", GuIA.Domain.Enums.UserRole.Admin);
        dbContext.Set<User>().Add(admin);
        await dbContext.SaveChangesAsync();
        Console.WriteLine(">>> Default admin created: admin@guia.app / Admin123!");
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseCors("AllowOrigins");

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
