import type { SearchResult } from '../../types'
import DocumentCard from '../documents/DocumentCard'
import Pagination from './Pagination'

interface SearchResultsProps {
  results: SearchResult | null
  loading: boolean
  error: string | null
  onPageChange: (page: number) => void
  onTitleClick?: (id: string) => void
  onDownload?: (id: string) => void
  onEdit?: (id: string) => void
}

export default function SearchResults({
  results,
  loading,
  error,
  onPageChange,
  onTitleClick,
  onDownload,
  onEdit,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-iupa-light bg-iupa-white p-5"
          >
            <div className="mb-3 h-5 w-3/5 rounded bg-iupa-light" />
            <div className="mb-2 h-3 w-full rounded bg-iupa-light" />
            <div className="mb-4 h-3 w-4/5 rounded bg-iupa-light" />
            <div className="flex gap-4">
              <div className="h-3 w-20 rounded bg-iupa-light" />
              <div className="h-3 w-24 rounded bg-iupa-light" />
              <div className="h-3 w-16 rounded bg-iupa-light" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-700">Error al cargar resultados</p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    )
  }

  if (!results || results.items.length === 0) {
    return (
      <div className="rounded-lg border border-iupa-light bg-iupa-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
          <svg
            className="h-7 w-7 text-iupa-green-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-iupa-dark">No se encontraron documentos</p>
        <p className="mt-1 text-xs text-iupa-medium">Intentá modificar los filtros de búsqueda</p>
      </div>
    )
  }

  const totalPages = Math.ceil(results.totalCount / results.pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-iupa-light bg-iupa-light/50 px-4 py-2.5 text-sm text-iupa-medium">
        <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="font-medium text-iupa-dark">
          {results.totalCount} resultado{results.totalCount !== 1 ? 's' : ''}
        </span>
        {totalPages > 1 && (
          <span className="text-iupa-medium">
            — Página {results.page} de {totalPages}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {results.items.map((doc) => (
          <DocumentCard key={doc.id} document={doc} onTitleClick={onTitleClick} onDownload={onDownload} onEdit={onEdit} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={results.page}
          totalPages={totalPages}
          totalCount={results.totalCount}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
