using System.Reflection;
using GuIA.Application.Common;
using Microsoft.Extensions.DependencyInjection;

namespace GuIA.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        });

        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
