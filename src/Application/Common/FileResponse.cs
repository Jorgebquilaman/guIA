namespace GuIA.Application.Common;

public record FileResponse(Stream Content, string ContentType, string FileName);
