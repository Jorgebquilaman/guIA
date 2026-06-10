namespace GuIA.Application.Ports;

public record StoredFileInfo(string StoredPath, string OriginalFileName, long SizeBytes);

public interface IFileStoragePort
{
    Task<StoredFileInfo> SaveAsync(Stream content, string fileName, string mimeType, CancellationToken ct = default);
    Task<Stream> GetAsync(string storedPath, CancellationToken ct = default);
    Task DeleteAsync(string storedPath, CancellationToken ct = default);
    Task<string> ExtractTextAsync(string storedPath, string mimeType, CancellationToken ct = default);
    Task<string?> GenerateThumbnailAsync(string storedPath, string mimeType, CancellationToken ct = default);
}
