using System.Diagnostics;
using GuIA.Application.Common;
using GuIA.Application.Ports;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SkiaSharp;

namespace GuIA.Infrastructure.Adapters;

public class LocalFileStorageAdapter : IFileStoragePort
{
    private readonly FileStorageSettings _settings;
    private readonly IAppDbContext _dbContext;
    private static readonly string? _markItDownScript = FindMarkItDownScript();

    public LocalFileStorageAdapter(IOptions<FileStorageSettings> settings, IAppDbContext dbContext)
    {
        _settings = settings.Value;
        _dbContext = dbContext;
        Directory.CreateDirectory(_settings.BasePath);
    }

    private static string? FindMarkItDownScript()
    {
        var candidates = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Scripts", "convert_to_markdown.py"),
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "convert_to_markdown.py"),
            Path.Combine(Directory.GetCurrentDirectory(), "Scripts", "convert_to_markdown.py"),
            "/opt/guia/scripts/convert_to_markdown.py",
        };
        return candidates.FirstOrDefault(File.Exists);
    }

    public async Task<StoredFileInfo> SaveAsync(Stream content, string fileName, string mimeType, CancellationToken ct = default)
    {
        long maxSize = _settings.MaxFileSizeBytes;
        var siteConfig = await _dbContext.SiteConfigs.FirstOrDefaultAsync(ct);
        if (siteConfig?.MaxFileSizeBytes > 0)
            maxSize = siteConfig.MaxFileSizeBytes.Value;

        if (content.Length > maxSize)
            throw new InvalidOperationException($"File exceeds maximum allowed size of {maxSize} bytes.");

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
        var mdPath = Path.ChangeExtension(fullPath, ".md");
        if (File.Exists(mdPath))
            File.Delete(mdPath);
        return Task.CompletedTask;
    }

    public async Task<string> ExtractTextAsync(string storedPath, string mimeType, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(storedPath);

        if (!File.Exists(fullPath))
            return string.Empty;

        try
        {
            // Check for cached .md file first
            var mdPath = Path.ChangeExtension(fullPath, ".md");
            if (File.Exists(mdPath))
            {
                var mdTime = File.GetLastWriteTimeUtc(mdPath);
                var srcTime = File.GetLastWriteTimeUtc(fullPath);
                if (mdTime >= srcTime)
                    return await File.ReadAllTextAsync(mdPath, ct);
            }

            // Try MarkItDown conversion for PDF/DOCX
            var markdown = await TryExtractWithMarkItDownAsync(fullPath, ct);
            if (markdown != null)
                return markdown;

            var text = mimeType switch
            {
                "application/pdf" => await ExtractPdfTextAsync(fullPath, ct),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ExtractDocxText(fullPath),
                "text/plain" => await File.ReadAllTextAsync(fullPath, ct),
                _ => string.Empty
            };

            return text;
        }
        catch
        {
            return string.Empty;
        }
    }

    public Task<int> GetPdfPageCountAsync(string storedPath, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(storedPath);

        if (!File.Exists(fullPath))
            return Task.FromResult(0);

        try
        {
            using var pdfDoc = UglyToad.PdfPig.PdfDocument.Open(fullPath);
            return Task.FromResult(pdfDoc.NumberOfPages);
        }
        catch
        {
            return Task.FromResult(0);
        }
    }

    private async Task<string?> TryExtractWithMarkItDownAsync(string fullPath, CancellationToken ct)
    {
        if (_markItDownScript == null)
            return null;

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "python3",
                Arguments = $"\"{_markItDownScript}\" \"{fullPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = new Process { StartInfo = psi };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync(ct);
            var error = await process.StandardError.ReadToEndAsync(ct);
            await process.WaitForExitAsync(ct);

            if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(output))
            {
                return null;
            }

            // Save to .md file alongside the original for caching
            var mdPath = Path.ChangeExtension(fullPath, ".md");
            await File.WriteAllTextAsync(mdPath, output, ct);

            return output;
        }
        catch
        {
            return null;
        }
    }

    private static async Task<string> ExtractPdfTextAsync(string fullPath, CancellationToken ct)
    {
        // Try PdfPig text extraction first
        string text;
        using (var pdfDoc = UglyToad.PdfPig.PdfDocument.Open(fullPath))
        {
            var pages = new List<string>();
            foreach (var page in pdfDoc.GetPages())
            {
                ct.ThrowIfCancellationRequested();
                pages.Add(page.Text);
            }
            text = string.Join("\n", pages);
        }

        // If PdfPig returned meaningful text, use it
        if (text.Length >= 50)
            return text;

        // Fallback to OCR with Tesseract
        return await ExtractPdfTextWithOcrAsync(fullPath, ct);
    }

    private static async Task<string> ExtractPdfTextWithOcrAsync(string fullPath, CancellationToken ct)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"guia_ocr_{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);

        try
        {
            // Step 1: Convert PDF pages to images using pdftoppm (200 DPI for speed)
            var ppmPsi = new ProcessStartInfo
            {
                FileName = "pdftoppm",
                Arguments = $"-png -r 200 \"{fullPath}\" \"{Path.Combine(tempDir, "page")}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using (var ppmProcess = new Process { StartInfo = ppmPsi })
            {
                ppmProcess.Start();
                await ppmProcess.WaitForExitAsync(ct);
                if (ppmProcess.ExitCode != 0)
                    return string.Empty;
            }

            // Step 2: Run Tesseract on each page image in parallel
            var pageFiles = Directory.GetFiles(tempDir, "page-*.png")
                .OrderBy(f => f)
                .ToList();

            if (pageFiles.Count == 0)
                return string.Empty;

            var ocrTasks = pageFiles.Select(pageFile => Task.Run(async () =>
            {
                ct.ThrowIfCancellationRequested();

                var tesseractPsi = new ProcessStartInfo
                {
                    FileName = "tesseract",
                    Arguments = $"\"{pageFile}\" stdout -l spa",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                };

                using var tessProcess = new Process { StartInfo = tesseractPsi };
                tessProcess.Start();

                var pageText = await tessProcess.StandardOutput.ReadToEndAsync(ct);
                await tessProcess.WaitForExitAsync(ct);

                return (tessProcess.ExitCode == 0 && !string.IsNullOrWhiteSpace(pageText))
                    ? pageText.TrimEnd()
                    : null;
            }, ct));

            var results = await Task.WhenAll(ocrTasks);
            var ocrResults = results.Where(r => r != null).ToList()!;

            var combined = string.Join("\n\n", ocrResults);

            // Cache the OCR result alongside the original file
            if (combined.Length > 0)
            {
                var mdPath = Path.ChangeExtension(fullPath, ".md");
                await File.WriteAllTextAsync(mdPath, combined, ct);
            }

            return combined;
        }
        catch
        {
            return string.Empty;
        }
        finally
        {
            try { Directory.Delete(tempDir, true); } catch { }
        }
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
