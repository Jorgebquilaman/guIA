using System.Threading.Channels;
using GuIA.Application.Common;
using GuIA.Application.Ports;
using GuIA.Infrastructure.Adapters;
using GuIA.Infrastructure.Persistence;
using GuIA.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GuIA.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        string? connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.EnableRetryOnFailure(3)));

        services.AddScoped<IAppDbContext>(sp =>
            sp.GetRequiredService<AppDbContext>());

        services.AddScoped<UserRepository>();
        services.AddScoped<DocumentRepository>();
        services.AddScoped<CollectionRepository>();

        services.AddScoped<IFileStoragePort, LocalFileStorageAdapter>();
        services.AddScoped<ILlmPort, DeepSeekLlmAdapter>();
        services.AddScoped<ISearchPort, PostgresFullTextSearchAdapter>();
        services.AddScoped<IEmailPort, SmtpEmailAdapter>();

        services.AddSingleton<AiProcessingQueue>();
        services.AddSingleton(sp =>
        {
            var queue = sp.GetRequiredService<AiProcessingQueue>();
            return queue.Writer;
        });
        services.AddSingleton(sp =>
        {
            var queue = sp.GetRequiredService<AiProcessingQueue>();
            return queue.Reader;
        });
        services.AddHostedService<AiProcessingWorker>();

        services.AddHttpClient();

        services.Configure<FileStorageSettings>(configuration.GetSection("FileStorage"));
        services.Configure<DeepSeekSettings>(configuration.GetSection("DeepSeek"));

        return services;
    }
}
