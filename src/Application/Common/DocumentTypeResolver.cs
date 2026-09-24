using GuIA.Domain.Enums;

namespace GuIA.Application.Common;

/// <summary>
/// Resuelve el tipo base (enum) efectivo de un documento a partir del
/// nombre de su tipo personalizado (DocumentTypeDef). Los nombres que no
/// corresponden a un valor del enum (tipos institucionales o media,
/// ej. "Resolución", "Audio") se resuelven como Other.
/// </summary>
public static class DocumentTypeResolver
{
    private static readonly Dictionary<string, DocumentType> ByName = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Article"] = DocumentType.Article,
        ["Thesis"] = DocumentType.Thesis,
        ["Book"] = DocumentType.Book,
        ["ConferenceDocument"] = DocumentType.ConferenceDocument,
        ["Dataset"] = DocumentType.Dataset,
        ["Software"] = DocumentType.Software,
        ["Link"] = DocumentType.Link,
        ["Other"] = DocumentType.Other,
        // Alias institucionales: nombres de tipos de catálogo en español
        ["Artículo"] = DocumentType.Article,
        ["Libro"] = DocumentType.Book,
        ["Tesis"] = DocumentType.Thesis,
        ["ObjetoConferencia"] = DocumentType.ConferenceDocument,
    };

    public static DocumentType FromDefName(string? defName)
    {
        if (string.IsNullOrWhiteSpace(defName))
            return DocumentType.Other;

        return ByName.TryGetValue(defName.Trim(), out var type)
            ? type
            : DocumentType.Other;
    }

    /// <summary>Indica si un nombre dado corresponde a un valor del enum base.</summary>
    public static bool IsBaseEnumName(string? name)
        => !string.IsNullOrWhiteSpace(name) && ByName.ContainsKey(name.Trim());
}
