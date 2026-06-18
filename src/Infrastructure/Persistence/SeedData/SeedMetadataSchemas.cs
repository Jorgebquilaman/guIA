using GuIA.Application.Common;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Infrastructure.Persistence.SeedData;

public static class SeedMetadataSchemas
{
    public static async Task SeedAsync(IAppDbContext context)
    {
        if (await context.MetadataSchemas.AnyAsync())
            return;

        // --- Article ---
        var article = new MetadataSchema("Article", "Artículo científico", true, 1);
        context.MetadataSchemas.Add(article);
        await SaveAndDetach(context);

        await AddFields(context, article.Id, new FieldDef[]
        {
            new("title_main", "dc.title", null, "Título del artículo", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 1, null, null),
            new("title_alt", "dc.title", "alternative", "Título en otros idiomas", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 2, null, null),
            new("creator", "dc.creator", "author", "Creador (autor)", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 3, null, null),
            new("subject_es", "dc.subject", null, "Palabras clave (español)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 4, null, null),
            new("subject_other", "dc.subject", "other", "Palabras clave (otro idioma)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 5, null, null),
            new("description_es", "dc.description", "resumen", "Resumen en español", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 6, null, null),
            new("description_abstract", "dc.description", "abstract", "Resumen en otros idiomas", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 7, null, null),
            new("description_fil", "dc.description", "fil", "Filiación del creador", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 8, null, null),
            new("publisher", "dc.publisher", null, "Editorial", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 9, null, null),
            new("contributor", "dc.contributor", "author", "Otros autores (coautores)", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 10, null, null),
            new("date_accessioned", "dc.date", "accessioned", "Fecha de ingreso", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 11, null, null),
            new("date_available", "dc.date", "available", "Fecha de disponibilidad", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 12, null, null),
            new("date_issued", "dc.date", "issued", "Fecha de publicación", FieldType.Date, ObligatorinessLevel.Mandatory, false, false, false, 13, null, null),
            new("date_embargo", "dc.date", "embargoEnd", "Fecha fin de embargo", FieldType.Date, ObligatorinessLevel.ConditionallyMandatory, false, false, false, 14, null, null),
            new("type_document", "dc.type", null, "Tipo de obra", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 15, null, new[]{ "artículo" }),
            new("type_version", "dc.type", null, "Versión de la publicación", FieldType.Select, ObligatorinessLevel.Mandatory, true, false, false, 16, null, new[]{ "acceptedVersion", "publishedVersion", "updatedVersion" }),
            new("format", "dc.format", null, "Formato", FieldType.Select, ObligatorinessLevel.Mandatory, true, false, false, 17, null, new[]{ "PDF", "MP4", "MPEG1", "MPEG2", "MPEG3" }),
            new("format_extent", "dc.format", "extent", "Páginas", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 18, null, null),
            new("identifier_uri", "dc.identifier", "uri", "Identificador digital (URI)", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 19, null, null),
            new("identifier_issn", "dc.identifier", "issn", "ISSN", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 20, null, null),
            new("identifier_issn_e", "dc.identifier", "issn-e", "ISSN-E", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 21, null, null),
            new("identifier_citation", "dc.identifier", "citation", "Cita bibliográfica (APA)", FieldType.Text, ObligatorinessLevel.Optional, false, false, false, 22, null, null),
            new("source", "dc.source", null, "Fuente (revista, vol., nro.)", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 23, null, null),
            new("language", "dc.language", null, "Idioma", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 24, null, null),
            new("relation", "dc.relation", null, "Relación", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 25, null, null),
            new("relation_referenced", "dc.relation", null, "Publicación referenciada", FieldType.Text, ObligatorinessLevel.Recommended, true, false, false, 26, null, null),
            new("relation_identifier", "dc.relation", null, "Identificador alternativo (DOI/URL)", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 27, null, null),
            new("relation_project", "dc.relation", "sponsorship", "Identificador del proyecto", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, false, false, false, 28, null, null),
            new("coverage_country", "dc.coverage", "country", "País de la editorial", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 29, null, null),
            new("coverage_city", "dc.coverage", "city", "Ciudad de la editorial", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 30, null, null),
            new("rights_access", "dc.rights", null, "Condiciones de uso", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 31, null, new[]{ "Acceso abierto", "Acceso con período de embargo", "Acceso parcialmente restringido", "Acceso restringido en su totalidad" }),
            new("rights_license", "dc.rights", "uri", "Nivel de accesibilidad (licencia)", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 32, null, new[]{ "Atribución-No Comercial-Sinderivadas(by-nc-nd)", "Atribución-No Comercial-Compartirigual(by-nc-sa)", "Atribución-Sinderivadas(by-nd)", "Atribución-Compartirigual(by-sa)", "Atribución-No Comercial(by-nc)", "Atribución(by)" }),
        });

        // --- ConferenceDocument ---
        var conf = new MetadataSchema("ConferenceDocument", "Documento de conferencia", true, 2);
        context.MetadataSchemas.Add(conf);
        await SaveAndDetach(context);

        await AddFields(context, conf.Id, new FieldDef[]
        {
            new("title_main", "dc.title", null, "Título del trabajo", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 1, null, null),
            new("title_alt", "dc.title", "alternative", "Título en otros idiomas", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 2, null, null),
            new("title_event", "dc.title", "event", "Título del evento", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 3, null, null),
            new("creator", "dc.creator", "author", "Creador (autor)", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 4, null, null),
            new("subject_es", "dc.subject", null, "Palabras clave (español)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 5, null, null),
            new("subject_other", "dc.subject", "other", "Palabras clave (otro idioma)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 6, null, null),
            new("description_es", "dc.description", "resumen", "Resumen en español", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 7, null, null),
            new("description_abstract", "dc.description", "abstract", "Resumen en otros idiomas", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 8, null, null),
            new("description_fil", "dc.description", "fil", "Filiación del creador", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 9, null, null),
            new("publisher", "dc.publisher", null, "Institución organizadora", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 10, null, null),
            new("contributor", "dc.contributor", "author", "Otros autores (coautores)", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 11, null, null),
            new("date_accessioned", "dc.date", "accessioned", "Fecha de ingreso", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 12, null, null),
            new("date_available", "dc.date", "available", "Fecha de disponibilidad", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 13, null, null),
            new("date_issued", "dc.date", "issued", "Fecha de presentación en el evento", FieldType.Date, ObligatorinessLevel.Mandatory, false, false, false, 14, null, null),
            new("date_embargo", "dc.date", "embargoEnd", "Fecha fin de embargo", FieldType.Date, ObligatorinessLevel.ConditionallyMandatory, false, false, false, 15, null, null),
            new("type_event", "dc.type", null, "Tipo de evento", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 16, null, new[]{ "conferencia", "congreso", "encuentro", "exposición", "feria", "jornada", "mesa redonda", "seminario", "simposio", "taller", "webinar", "workshop", "otro" }),
            new("type_document", "dc.type", null, "Tipo de objeto (interno)", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 17, null, new[]{ "conference object" }),
            new("type_version", "dc.type", null, "Versión de la publicación", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 18, null, new[]{ "acceptedVersion", "publishedVersion", "updatedVersion" }),
            new("format", "dc.format", null, "Formato", FieldType.Select, ObligatorinessLevel.Mandatory, true, false, false, 19, null, new[]{ "PDF", "MP4", "MPEG1", "MPEG2", "MPEG3" }),
            new("format_extent", "dc.format", "extent", "Páginas", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 20, null, null),
            new("identifier_uri", "dc.identifier", "uri", "Identificador digital (URI)", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 21, null, null),
            new("identifier_isbn", "dc.identifier", "isbn", "ISBN", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 22, null, null),
            new("identifier_issn", "dc.identifier", "issn", "ISSN", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 23, null, null),
            new("identifier_citation", "dc.identifier", "citation", "Cita bibliográfica (APA)", FieldType.Text, ObligatorinessLevel.Optional, false, false, false, 24, null, null),
            new("source", "dc.source", null, "Fuente", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 25, null, null),
            new("language", "dc.language", null, "Idioma", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 26, null, null),
            new("relation", "dc.relation", null, "Relación", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 27, null, null),
            new("relation_referenced", "dc.relation", null, "Publicación referenciada", FieldType.Text, ObligatorinessLevel.Recommended, true, false, false, 28, null, null),
            new("relation_identifier", "dc.relation", null, "Identificador alternativo (DOI/URL)", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 29, null, null),
            new("relation_project", "dc.relation", "sponsorship", "Identificador del proyecto", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, false, false, false, 30, null, null),
            new("coverage_country", "dc.coverage", "country", "País sede del evento", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 31, null, null),
            new("coverage_city", "dc.coverage", "city", "Ciudad sede del evento", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 32, null, null),
            new("rights_access", "dc.rights", null, "Condiciones de uso", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 33, null, new[]{ "Acceso abierto", "Acceso con período de embargo", "Acceso parcialmente restringido", "Acceso restringido en su totalidad" }),
            new("rights_license", "dc.rights", "uri", "Nivel de accesibilidad (licencia)", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 34, null, new[]{ "Atribución-No Comercial-Sinderivadas(by-nc-nd)", "Atribución-No Comercial-Compartirigual(by-nc-sa)", "Atribución-Sinderivadas(by-nd)", "Atribución-Compartirigual(by-sa)", "Atribución-No Comercial(by-nc)", "Atribución(by)" }),
        });

        // --- Book ---
        var book = new MetadataSchema("Book", "Libro o parte de libro", true, 3);
        context.MetadataSchemas.Add(book);
        await SaveAndDetach(context);

        await AddFields(context, book.Id, new FieldDef[]
        {
            new("title_main", "dc.title", null, "Título", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 1, null, null),
            new("title_alt", "dc.title", "alternative", "Título en otros idiomas", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 2, null, null),
            new("creator", "dc.creator", "author", "Creador (autor)", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 3, null, null),
            new("subject_es", "dc.subject", null, "Palabras clave (español)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 4, null, null),
            new("subject_other", "dc.subject", "other", "Palabras clave (otro idioma)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 5, null, null),
            new("description_es", "dc.description", "resumen", "Resumen en español", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 6, null, null),
            new("description_abstract", "dc.description", "abstract", "Resumen en otros idiomas", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 7, null, null),
            new("description_fil", "dc.description", "fil", "Filiación del creador", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 8, null, null),
            new("publisher", "dc.publisher", null, "Editorial / Institución", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 9, null, null),
            new("contributor", "dc.contributor", "author", "Otros autores (coautores)", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 10, null, null),
            new("date_accessioned", "dc.date", "accessioned", "Fecha de ingreso", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 11, null, null),
            new("date_available", "dc.date", "available", "Fecha de disponibilidad", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 12, null, null),
            new("date_issued", "dc.date", "issued", "Fecha de publicación", FieldType.Date, ObligatorinessLevel.Mandatory, false, false, false, 13, null, null),
            new("date_embargo", "dc.date", "embargoEnd", "Fecha fin de embargo", FieldType.Date, ObligatorinessLevel.ConditionallyMandatory, false, false, false, 14, null, null),
            new("type_material", "dc.type", null, "Tipo de material", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 15, null, new[]{ "libro", "parte de libro" }),
            new("type_version", "dc.type", null, "Versión de la publicación", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 16, null, new[]{ "acceptedVersion", "publishedVersion", "updatedVersion" }),
            new("format", "dc.format", null, "Formato", FieldType.Select, ObligatorinessLevel.Mandatory, true, false, false, 17, null, new[]{ "PDF", "MP4", "MPEG1", "MPEG2", "MPEG3" }),
            new("format_extent", "dc.format", "extent", "Páginas", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 18, null, null),
            new("identifier_uri", "dc.identifier", "uri", "Identificador digital (URI)", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 19, null, null),
            new("identifier_isbn", "dc.identifier", "isbn", "ISBN", FieldType.Text, ObligatorinessLevel.Optional, true, false, false, 20, null, null),
            new("identifier_citation", "dc.identifier", "citation", "Cita bibliográfica (APA)", FieldType.Text, ObligatorinessLevel.Optional, false, false, false, 21, null, null),
            new("source", "dc.source", null, "Fuente", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 22, null, null),
            new("language", "dc.language", null, "Idioma", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 23, null, null),
            new("relation", "dc.relation", null, "Relación", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 24, null, null),
            new("relation_referenced", "dc.relation", null, "Publicación referenciada", FieldType.Text, ObligatorinessLevel.Recommended, true, false, false, 25, null, null),
            new("relation_identifier", "dc.relation", null, "Identificador alternativo (DOI/URL)", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 26, null, null),
            new("relation_project", "dc.relation", "sponsorship", "Identificador del proyecto", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, false, false, false, 27, null, null),
            new("coverage_spatial", "dc.coverage", "spatial", "Cobertura espacial", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 28, null, null),
            new("rights_access", "dc.rights", null, "Condiciones de uso", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 29, null, new[]{ "Acceso abierto", "Acceso con período de embargo", "Acceso parcialmente restringido", "Acceso restringido en su totalidad" }),
            new("rights_license", "dc.rights", "uri", "Nivel de accesibilidad (licencia)", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 30, null, new[]{ "Atribución-No Comercial-Sinderivadas(by-nc-nd)", "Atribución-No Comercial-Compartirigual(by-nc-sa)", "Atribución-Sinderivadas(by-nd)", "Atribución-Compartirigual(by-sa)", "Atribución-No Comercial(by-nc)", "Atribución(by)" }),
        });

        // --- Thesis ---
        var thesis = new MetadataSchema("Thesis", "Tesis / Trabajo Final", true, 4);
        context.MetadataSchemas.Add(thesis);
        await SaveAndDetach(context);

        await AddFields(context, thesis.Id, new FieldDef[]
        {
            new("title_main", "dc.title", null, "Título", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 1, null, null),
            new("title_alt", "dc.title", "alternative", "Título en otros idiomas", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 2, null, null),
            new("creator", "dc.creator", "author", "Creador (autor)", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 3, null, null),
            new("subject_es", "dc.subject", null, "Palabras clave (español)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 4, null, null),
            new("subject_other", "dc.subject", "other", "Palabras clave (otro idioma)", FieldType.MultiText, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 5, null, null),
            new("description_es", "dc.description", "resumen", "Resumen en español", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 6, null, null),
            new("description_abstract", "dc.description", "abstract", "Resumen en otros idiomas", FieldType.Textarea, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 7, null, null),
            new("description_fil", "dc.description", "fil", "Filiación del creador", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 8, null, null),
            new("publisher", "dc.publisher", null, "Institución/Universidad", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 9, null, null),
            new("contributor_director", "dc.contributor", "director", "Director de Tesis", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 10, null, null),
            new("contributor_codirector", "dc.contributor", "codirector", "Co-Director de Tesis", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 11, null, null),
            new("date_accessioned", "dc.date", "accessioned", "Fecha de ingreso", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 12, null, null),
            new("date_available", "dc.date", "available", "Fecha de disponibilidad", FieldType.Date, ObligatorinessLevel.NotApplicable, false, true, false, 13, null, null),
            new("date_issued", "dc.date", "issued", "Fecha de presentación / defensa", FieldType.Date, ObligatorinessLevel.Mandatory, false, false, false, 14, null, null),
            new("date_embargo", "dc.date", "embargoEnd", "Fecha fin de embargo", FieldType.Date, ObligatorinessLevel.ConditionallyMandatory, false, false, false, 15, null, null),
            new("type_thesis", "dc.type", null, "Tipo de tesis", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 16, null, new[]{ "tesis de grado", "trabajo final de grado", "bachelorThesis" }),
            new("type_degree", "dc.type", null, "Grado obtenido", FieldType.Text, ObligatorinessLevel.Optional, false, false, false, 17, null, null),
            new("type_version", "dc.type", null, "Versión de la publicación", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 18, null, new[]{ "acceptedVersion", "publishedVersion", "updatedVersion" }),
            new("format", "dc.format", null, "Formato", FieldType.Select, ObligatorinessLevel.Mandatory, true, false, false, 19, null, new[]{ "PDF", "MP4", "MPEG1", "MPEG2", "MPEG3" }),
            new("format_extent", "dc.format", "extent", "Páginas", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 20, null, null),
            new("identifier_uri", "dc.identifier", "uri", "Identificador digital (URI)", FieldType.Text, ObligatorinessLevel.Mandatory, false, false, false, 21, null, null),
            new("identifier_citation", "dc.identifier", "citation", "Cita bibliográfica (APA)", FieldType.Text, ObligatorinessLevel.Optional, false, false, false, 22, null, null),
            new("language", "dc.language", null, "Idioma", FieldType.Text, ObligatorinessLevel.Mandatory, true, false, false, 23, null, null),
            new("relation", "dc.relation", null, "Relación", FieldType.Text, ObligatorinessLevel.ConditionallyMandatory, true, false, false, 24, null, null),
            new("relation_referenced", "dc.relation", null, "Publicación referenciada", FieldType.Text, ObligatorinessLevel.Recommended, true, false, false, 25, null, null),
            new("relation_identifier", "dc.relation", null, "Identificador alternativo (DOI/URL)", FieldType.Text, ObligatorinessLevel.Recommended, false, false, false, 26, null, null),
            new("rights_access", "dc.rights", null, "Condiciones de uso", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 27, null, new[]{ "Acceso abierto", "Acceso con período de embargo", "Acceso parcialmente restringido", "Acceso restringido en su totalidad" }),
            new("rights_license", "dc.rights", "uri", "Nivel de accesibilidad (licencia)", FieldType.Select, ObligatorinessLevel.Mandatory, false, false, false, 28, null, new[]{ "Atribución-No Comercial-Sinderivadas(by-nc-nd)", "Atribución-No Comercial-Compartirigual(by-nc-sa)", "Atribución-Sinderivadas(by-nd)", "Atribución-Compartirigual(by-sa)", "Atribución-No Comercial(by-nc)", "Atribución(by)" }),
        });
    }

    private static async Task SaveAndDetach(IAppDbContext context)
    {
        await context.SaveChangesAsync();
        foreach (var entry in context.ChangeTracker.Entries().ToList())
            entry.State = EntityState.Detached;
    }

    private static async Task AddFields(IAppDbContext context, Guid schemaId, FieldDef[] fields)
    {
        foreach (var f in fields)
        {
            var field = new MetadataField(schemaId, f.Element, f.Qualifier, f.InternalName, f.Label, f.FieldType, f.Obligatoriness, f.IsRepeatable, f.IsReadOnly, f.IsHidden, f.SortOrder, f.HelpText);
            context.MetadataFields.Add(field);
            await context.SaveChangesAsync();

            if (f.Options != null)
            {
                bool isSingle = f.Options.Length == 1;
                for (int i = 0; i < f.Options.Length; i++)
                {
                    var option = new MetadataFieldOption(field.Id, f.Options[i], f.Options[i], isSingle && i == 0, i);
                    context.MetadataFieldOptions.Add(option);
                }
                await context.SaveChangesAsync();
            }
        }
    }

    private record FieldDef(string InternalName, string Element, string? Qualifier, string Label,
        FieldType FieldType, ObligatorinessLevel Obligatoriness, bool IsRepeatable,
        bool IsReadOnly, bool IsHidden, int SortOrder, string? HelpText, string[]? Options);
}
