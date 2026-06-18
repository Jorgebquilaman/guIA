using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Search;

public record GetAuthorSuggestionsQuery(string Prefix) : IRequest<List<string>>;

public class GetAuthorSuggestionsQueryHandler : IRequestHandler<GetAuthorSuggestionsQuery, List<string>>
{
    private readonly IAppDbContext _context;

    public GetAuthorSuggestionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> Handle(GetAuthorSuggestionsQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Prefix))
            return new List<string>();

        string prefix = request.Prefix.Trim().ToLower();

        return await _context.DocumentAuthors
            .Where(a => a.Name.ToLower().Contains(prefix))
            .Select(a => a.Name)
            .Distinct()
            .OrderBy(v => v)
            .Take(20)
            .ToListAsync(ct);
    }
}
