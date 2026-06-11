import { useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSearchDocuments } from '../api/documents'
import { useCollections } from '../api/collections'
import type { SearchResult, DocumentType } from '../types'
import SearchBar from '../components/search/SearchBar'
import SearchFilters from '../components/search/SearchFilters'
import SearchResults from '../components/search/SearchResults'

function getFiltersFromParams(params: URLSearchParams) {
  const types = params.get('types')?.split(',').filter(Boolean) as DocumentType[] | undefined
  return {
    types: types ?? [],
    collectionId: params.get('collectionId') ?? null,
    dateFrom: params.get('dateFrom') ?? '',
    dateTo: params.get('dateTo') ?? '',
    language: params.get('language') ?? '',
  }
}

export default function Search() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const filters = useMemo(() => getFiltersFromParams(searchParams), [searchParams])

  const { data: collections } = useCollections()

  const searchQuery = useMemo(() => ({
    q: query || undefined,
    type: filters.types.length === 1 ? filters.types[0] : undefined,
    collectionId: filters.collectionId ?? undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page,
    pageSize: 20,
  }), [query, filters, page])

  const { data, isLoading, isError, error } = useSearchDocuments(searchQuery)

  const results: SearchResult | null = useMemo(() => {
    const items = Array.isArray(data) ? data : []
    return items.length > 0 || query
      ? { query, items, totalCount: items.length, page, pageSize: 20, facets: {} }
      : null
  }, [data, query, page])

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '' || value === null) {
          next.delete(key)
        } else {
          next.set(key, value)
        }
      }
      if (updates.q !== undefined) next.set('page', '1')
      return next
    })
  }, [setSearchParams])

  const handleQueryChange = useCallback((q: string) => {
    updateParams({ q: q || undefined })
  }, [updateParams])

  const handleFiltersChange = useCallback((f: ReturnType<typeof getFiltersFromParams>) => {
    updateParams({
      types: f.types.length > 0 ? f.types.join(',') : undefined,
      collectionId: f.collectionId ?? undefined,
      dateFrom: f.dateFrom || undefined,
      dateTo: f.dateTo || undefined,
      language: f.language || undefined,
    })
  }, [updateParams])

  const handlePageChange = useCallback((p: number) => {
    updateParams({ page: String(p) })
  }, [updateParams])

  const currentCollection = filters.collectionId
    ? collections?.find((c) => c.id === filters.collectionId)
    : null

  return (
    <div className="flex h-full flex-col">
      <div className="relative bg-gradient-to-br from-[#0a2a20] to-[#061512] px-6 py-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-4 text-xl font-bold tracking-tight">
            {currentCollection ? `Búsqueda en ${currentCollection.name}` : 'Buscar documentos'}
          </h1>
          <SearchBar value={query} onChange={handleQueryChange} placeholder="Buscá por título, autor, palabras clave..." />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-gradient-to-b from-iupa-green-light/30 via-white to-white">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-iupa-light bg-white/80 p-4 backdrop-blur-sm lg:block">
          <SearchFilters
            filters={filters}
            onChange={handleFiltersChange}
            collections={collections ?? []}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {!query && !filters.types.length && !filters.collectionId ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-iupa-green-light to-iupa-green/10 shadow-sm">
                  <svg
                    className="h-10 w-10 text-iupa-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-iupa-dark">Buscar documentos</p>
                <p className="mt-1.5 text-sm text-iupa-medium">
                  Escribí en la barra de búsqueda o usá los filtros del panel lateral para encontrar documentos
                </p>
              </div>
            </div>
          ) : (
            <SearchResults
              results={results}
              loading={isLoading}
              error={isError ? (error instanceof Error ? error.message : 'Error al cargar resultados') : null}
              onPageChange={handlePageChange}
              onTitleClick={(id) => navigate(`/app/browse/${id}`)}
              onDownload={(id) => navigate(`/app/browse/${id}`)}
            />
          )}
        </main>
      </div>
    </div>
  )
}
