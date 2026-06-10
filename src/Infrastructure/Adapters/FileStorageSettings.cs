namespace GuIA.Infrastructure.Adapters;

public class FileStorageSettings
{
    public const string SectionName = "FileStorage";

    public string BasePath { get; set; } = "./storage";
    public long MaxFileSizeBytes { get; set; } = 52_428_800;
    public List<string> AllowedMimeTypes { get; set; } = new()
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };
}
