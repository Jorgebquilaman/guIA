using GuIA.Application.Ports;
using Microsoft.Extensions.Options;
using SkiaSharp;

namespace GuIA.Infrastructure.Adapters;

public class LocalFileStorageAdapter : IFileStoragePort
{
    private readonly FileStorageSettings _settings;

    public LocalFileStorageAdapter(IOptions<FileStorageSettings> settings)
    {
        _settings = settings.Value;
        Directory.CreateDirectory(_settings.BasePath);
    }

    public async Task<StoredFileInfo> SaveAsync(Stream content, string fileName, string mimeType, CancellationToken ct = default)
    {
        if (content.Length > _settings.MaxFileSizeBytes)
            throw new InvalidOperationException($"File exceeds maximum allowed size of {_settings.MaxFileSizeBytes} bytes.");

        if (_settings.AllowedMimeTypes.Count > 0 && !_settings.AllowedMimeTypes.Contains(mimeType))
            throw new InvalidOperationException($"MIME type '{mimeType}' is not allowed.");

        var now = DateTime.UtcNow;
        var datePath = Path.Combine(now.Year.ToString("D4"), now.Month.ToString("D2"), now.Day.ToString("D2"));
        var dir = Path.Combine(_settings.BasePath, datePath);
        Directory.CreateDirectory(dir);

        var ext = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid():N}_{SanitizeFileName(fileName)}";
        var storedPath = Path.Combine(datePath, uniqueName);
        var fullPath = Path.Combine(_settings.BasePath, storedPath);

        await using var fs = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 4096, true);
        await content.CopyToAsync(fs, ct);

        return new StoredFileInfo(storedPath, fileName, content.Length);
    }

    public Task<Stream> GetAsync(string storedPath, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(storedPath);
        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, true);
        return Task.FromResult<Stream>(stream);
    }

    public Task DeleteAsync(string storedPath, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(storedPath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }

    public async Task<string> ExtractTextAsync(string storedPath, string mimeType, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(storedPath);

        if (!File.Exists(fullPath))
            return string.Empty;

        try
        {
            return mimeType switch
            {
                "application/pdf" => await ExtractPdfTextAsync(fullPath, ct),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ExtractDocxText(fullPath),
                "text/plain" => await File.ReadAllTextAsync(fullPath, ct),
                _ => string.Empty
            };
        }
        catch
        {
            return string.Empty;
        }
    }

    private static Task<string> ExtractPdfTextAsync(string fullPath, CancellationToken ct)
    {
        using var pdfDoc = UglyToad.PdfPig.PdfDocument.Open(fullPath);
        var pages = new List<string>();
        foreach (var page in pdfDoc.GetPages())
        {
            ct.ThrowIfCancellationRequested();
            pages.Add(page.Text);
        }
        return Task.FromResult(string.Join("\n", pages));
    }

    private static string ExtractDocxText(string fullPath)
    {
        using var doc = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(fullPath, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body == null)
            return string.Empty;

        var text = new System.Text.StringBuilder();
        foreach (var para in body.Elements<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
        {
            foreach (var run in para.Elements<DocumentFormat.OpenXml.Wordprocessing.Run>())
            {
                text.Append(run.InnerText);
            }
            text.AppendLine();
        }
        return text.ToString().TrimEnd();
    }

    public Task<string?> GenerateThumbnailAsync(string storedPath, string mimeType, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(storedPath);
        if (!File.Exists(fullPath))
            return Task.FromResult<string?>(null);

        if (!mimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult<string?>(null);

        try
        {
            using var input = File.OpenRead(fullPath);
            using var original = SKBitmap.Decode(input);
            if (original == null)
                return Task.FromResult<string?>(null);

            const int maxDimension = 300;
            float scale = Math.Min((float)maxDimension / original.Width, (float)maxDimension / original.Height);
            if (scale >= 1f)
                return Task.FromResult<string?>(null);

            int newWidth = (int)(original.Width * scale);
            int newHeight = (int)(original.Height * scale);
            using var resized = original.Resize(new SKImageInfo(newWidth, newHeight), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
            if (resized == null)
                return Task.FromResult<string?>(null);

            using var image = SKImage.FromBitmap(resized);
            using var data = image.Encode(SKEncodedImageFormat.Jpeg, 80);

            var thumbDir = Path.Combine(_settings.BasePath, "thumbnails");
            Directory.CreateDirectory(thumbDir);
            var thumbName = $"{Guid.NewGuid():N}_thumb.jpg";
            var thumbPath = Path.Combine("thumbnails", thumbName);
            var fullThumbPath = Path.Combine(_settings.BasePath, thumbPath);

            using var fs = new FileStream(fullThumbPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            data.SaveTo(fs);

            return Task.FromResult<string?>(thumbPath);
        }
        catch
        {
            return Task.FromResult<string?>(null);
        }
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Select(c => invalid.Contains(c) ? '_' : c).ToArray());
        return sanitized.Length > 100 ? sanitized[..100] : sanitized;
    }

    private string GetFullPath(string storedPath)
    {
        var full = Path.Combine(_settings.BasePath, storedPath);
        var fullRoot = Path.GetFullPath(full);
        var baseRoot = Path.GetFullPath(_settings.BasePath);
        if (!fullRoot.StartsWith(baseRoot, StringComparison.Ordinal))
            throw new InvalidOperationException("Path traversal detected.");
        return fullRoot;
    }
}
