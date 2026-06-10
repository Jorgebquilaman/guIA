using GuIA.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GuIA.Application.UseCases.Search;

public record GetKeywordSuggestionsQuery(string Prefix) : IRequest<List<string>>;

public class GetKeywordSuggestionsQueryHandler : IRequestHandler<GetKeywordSuggestionsQuery, List<string>>
{
    private readonly IAppDbContext _context;

    public GetKeywordSuggestionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> Handle(GetKeywordSuggestionsQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Prefix))
            return new List<string>();

        string prefix = request.Prefix.Trim().ToLower();

        return await _context.Keywords
            .Where(k => k.Value.StartsWith(prefix))
            .Select(k => k.Value)
            .Distinct()
            .OrderBy(v => v)
            .Take(20)
            .ToListAsync(ct);
    }
}
