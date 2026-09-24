using System.Runtime.CompilerServices;
using GuIA.Application.Common;
using GuIA.Application.DTOs;
using GuIA.Domain.Entities;
using GuIA.Domain.Enums;
using GuIA.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GuIA.Application.UseCases.Documents;

public record UpdateDocumentMetadataCommand(
    Guid DocumentId,
    string? Title,
    string? Description,
    string? Type,
    List<AuthorDto>? Authors,
    List<string>? Keywords,
    string? AdvisorName,
    string? Institution,
    DateTime? PublicationDate,
    string? AbstractEs,
    string? License,
    string? Department,
    string? DegreeProgram,
    string? Language,
    Guid? DocumentTypeId = null,
    List<MediaLinkDto>? MediaLinks = null
) : IRequest;

public class UpdateDocumentMetadataCommandHandler : IRequestHandler<UpdateDocumentMetadataCommand>
{
    private readonly IAppDbContext _context;

    public UpdateDocumentMetadataCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateDocumentMetadataCommand request, CancellationToken ct)
    {
        var status = await _context.Documents
            .Where(d => d.Id == request.DocumentId && d.DeletedAt == null)
            .Select(d => d.Status)
            .FirstOrDefaultAsync(ct);

        if (status == Domain.Enums.DocumentStatus.Published)
            throw new InvalidOperationException("Cannot modify a published document.");

        // Build dynamic UPDATE for scalar fields using FormattableString
        var setItems = new List<string>();
        var paramValues = new List<object>();
        int paramIndex = 0;

        void AddSet(string column, object value)
        {
            var columnName = $"\"{column}\"";
            if (setItems.Any(s => s.StartsWith(columnName + " = ")))
                return;
            setItems.Add($"{columnName} = {{{paramIndex}}}");
            paramValues.Add(value);
            paramIndex++;
        }

        if (request.Title != null) AddSet("title", request.Title);
        if (request.Description != null) AddSet("description", request.Description);

        // Tipo base: una sola asignación de "type" — si viene documentTypeId, la
        // definición personalizada es autoritativa y define el tipo base; si no,
        // se usa el nombre recibido cuando es un valor del enum.
        string? baseTypeValue = null;

        if (request.DocumentTypeId != null)
        {
            AddSet("document_type_def_id", request.DocumentTypeId);
            var defName = await _context.DocumentTypeDefs
                .Where(t => t.Id == request.DocumentTypeId)
                .Select(t => t.Name)
                .FirstOrDefaultAsync(ct);
            baseTypeValue = GuIA.Application.Common.DocumentTypeResolver.FromDefName(defName).ToString();
        }
        else if (request.Type != null)
        {
            // Si el nombre no es un valor del enum (ej. "Resolución"), Other
            baseTypeValue = GuIA.Application.Common.DocumentTypeResolver.IsBaseEnumName(request.Type)
                ? Enum.Parse<DocumentType>(request.Type, ignoreCase: true).ToString()
                : DocumentType.Other.ToString();
        }

        if (baseTypeValue != null)
            AddSet("type", baseTypeValue);
        if (request.AdvisorName != null) AddSet("advisor_name", request.AdvisorName);
        if (request.Institution != null) AddSet("institution", request.Institution);
        if (request.PublicationDate != null) AddSet("publication_date", request.PublicationDate.Value);
        if (request.AbstractEs != null) AddSet("abstract_es", request.AbstractEs);
        if (request.License != null) AddSet("license", request.License);
        if (request.Department != null) AddSet("department", request.Department);
        if (request.DegreeProgram != null) AddSet("degree_program", request.DegreeProgram);
        if (request.MediaLinks != null)
        {
            setItems.Add($"\"media_links\" = {{{paramIndex}}}::jsonb");
            paramValues.Add(JsonSerializer.Serialize(request.MediaLinks));
            paramIndex++;
        }
        AddSet("UpdatedAt", DateTime.UtcNow);

        if (paramValues.Count > 0)
        {
            var docIdParam = paramIndex;
            var sql = $"UPDATE documents SET {string.Join(", ", setItems)} WHERE \"Id\" = {{{docIdParam}}} AND \"DeletedAt\" IS NULL";
            paramValues.Add(request.DocumentId);
            await _context.Database.ExecuteSqlInterpolatedAsync(
                FormattableStringFactory.Create(sql, paramValues.ToArray()), ct);
        }

        // Sync authors: delete all and re-insert
        if (request.Authors != null)
        {
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM document_authors WHERE \"DocumentId\" = {request.DocumentId}", ct);

            int order = 1;
            foreach (var a in request.Authors)
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"""INSERT INTO document_authors ("Id", "DocumentId", name, email, orcid, "order") VALUES ({Guid.NewGuid()}, {request.DocumentId}, {a.Name}, {(object?)a.Email ?? null}, {(object?)a.Orcid ?? null}, {(a.Order > 0 ? a.Order : order)})""",
                    ct);
                order++;
            }
        }

        // Sync keywords: delete all and re-insert
        if (request.Keywords != null)
        {
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM document_keywords WHERE \"DocumentsId\" = {request.DocumentId}", ct);

            foreach (var keywordValue in request.Keywords)
            {
                var trimmed = keywordValue.Trim();
                if (string.IsNullOrWhiteSpace(trimmed)) continue;
                string lower = trimmed.ToLowerInvariant();
                var existingKeyword = await _context.Keywords
                    .FirstOrDefaultAsync(k => k.Value.ToLower() == lower, ct);

                Guid keywordId;
                if (existingKeyword != null)
                {
                    keywordId = existingKeyword.Id;
                    // El formato que escribe el usuario gana: actualizo el caso si difiere
                    if (existingKeyword.Value != trimmed)
                        await _context.Database.ExecuteSqlInterpolatedAsync(
                            $"UPDATE keywords SET value = {trimmed} WHERE \"Id\" = {existingKeyword.Id}", ct);
                }
                else
                {
                    keywordId = Guid.NewGuid();
                    await _context.Database.ExecuteSqlInterpolatedAsync(
                        $"""INSERT INTO keywords ("Id", value, source, "CreatedAt") VALUES ({keywordId}, {trimmed}, {KeywordSource.Manual.ToString()}, {DateTime.UtcNow})""",
                        ct);
                }

                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"""INSERT INTO document_keywords ("DocumentsId", "KeywordsId") VALUES ({request.DocumentId}, {keywordId}) ON CONFLICT DO NOTHING""",
                    ct);
            }
        }
    }
}
