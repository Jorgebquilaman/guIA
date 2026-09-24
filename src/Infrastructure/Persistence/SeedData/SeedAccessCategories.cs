using GuIA.Application.Common;
using GuIA.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Infrastructure.Persistence.SeedData;

public static class SeedAccessCategories
{
    public static async Task SeedAsync(IAppDbContext context)
    {
        if (!await context.AuthorMetadataSettings.AnyAsync())
        {
            context.AuthorMetadataSettings.Add(new AuthorMetadataSettings(
                "Autorizo la publicación de mis datos personales (nombre, filiación, ORCID y demás información de perfil de autor) junto con mis producciones en el Repositorio Institucional del IUPA, en acceso abierto, conforme a la Ley Nº 25.326 de Protección de Datos Personales. Puedo retirar esta autorización en cualquier momento desde mi perfil, sin que ello afecte el acceso a los documentos ya publicados."));
            await context.SaveChangesAsync();
            Console.WriteLine(">>> Author metadata consent text seeded.");
        }

        if (await context.AccessCategories.AnyAsync())
            return;

        var defaults = new[]
        {
            new AccessCategory(
                "Estudiante",
                "Si sos estudiante del IUPA y necesitás buscar, leer y descargar material del repositorio para tus estudios y trabajos.",
                1),
            new AccessCategory(
                "Docente",
                "Si sos docente del IUPA y querés subir producciones académicas, gestionar material de tus cátedras o publicar en el repositorio.",
                2),
            new AccessCategory(
                "Investigador",
                "Si realizás actividades de investigación y necesitás depositar producciones científicas, tesis o datasets, y acceder al material completo.",
                3),
        };

        context.AccessCategories.AddRange(defaults);
        await context.SaveChangesAsync();
        Console.WriteLine(">>> Default access categories seeded: Estudiante, Docente, Investigador.");
    }
}
