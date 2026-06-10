interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('ellipsis')

  pages.push(total)

  return pages
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <div className="flex items-center justify-between border-t border-iupa-light pt-4">
      <p className="text-xs text-iupa-medium">{totalCount} total</p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded px-2 py-1 text-sm text-iupa-medium hover:bg-iupa-green-light disabled:cursor-not-allowed disabled:opacity-30"
        >
          Anterior
        </button>

        {pages.map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-iupa-medium">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`rounded px-2.5 py-1 text-sm ${
                page === currentPage
                  ? 'bg-iupa-green text-white'
                  : 'text-iupa-medium hover:bg-iupa-green-light'
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded px-2 py-1 text-sm text-iupa-medium hover:bg-iupa-green-light disabled:cursor-not-allowed disabled:opacity-30"
        >
          Siguiente
        </button>
      </nav>

      <p className="text-xs text-iupa-medium">
        Página {currentPage} de {totalPages}
      </p>
    </div>
  )
}
