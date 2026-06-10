import type { Document } from '../../types'
import { useAuthStore } from '../../store/authStore'

interface DocumentCardProps {
  document: Document
  onTitleClick?: (id: string) => void
  onDownload?: (id: string) => void
  onEdit?: (id: string) => void
}

const typeColors: Record<string, string> = {
  Article: 'bg-iupa-green-light text-iupa-green',
  Thesis: 'bg-purple-100 text-purple-800',
  Dataset: 'bg-green-100 text-green-800',
  Software: 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800',
}

const statusColors: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-800',
  Draft: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-cyan-100 text-cyan-800',
  Rejected: 'bg-red-100 text-red-800',
}

export default function DocumentCard({
  document,
  onTitleClick,
  onDownload,
  onEdit,
}: DocumentCardProps) {
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.id === document.uploadedByUserId
  const isAdmin = user?.role === 'Admin'
  const hasThumbnail = document.hasCoverImage || document.files?.[0]?.hasThumbnail

  return (
    <div className="overflow-hidden rounded-lg border border-iupa-light border-l-4 border-l-iupa-green bg-iupa-white shadow-sm transition hover:shadow-md">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="shrink-0">
              {hasThumbnail ? (
                <img
                  src={`/api/documents/${document.id}/thumbnail`}
                  alt=""
                  className="h-24 w-20 rounded object-cover"
                />
              ) : (
                <div className="flex h-24 w-20 items-center justify-center rounded bg-iupa-light">
                  <svg className="h-8 w-8 text-iupa-medium/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-iupa-dark">
                  <button
                    onClick={() => onTitleClick?.(document.id)}
                    className="text-left hover:text-iupa-green focus:outline-none"
                  >
                    {document.title}
                  </button>
                </h3>
                <div className="flex shrink-0 gap-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[document.type] || typeColors.Other}`}
                  >
                    {document.type}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[document.status] || ''}`}
                  >
                    {document.status}
                  </span>
                </div>
              </div>

              {document.aiMetadata?.summary && (
                <p className="mb-2 line-clamp-2 text-sm text-iupa-medium">
                  {document.aiMetadata.summary}
                </p>
              )}

              {document.keywords.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {document.keywords.slice(0, 6).map((kw) => (
                    <span
                      key={kw}
                      className="inline-block rounded bg-iupa-light px-2 py-0.5 text-xs text-iupa-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-2 flex flex-wrap gap-3 text-xs text-iupa-medium">
                {document.authors.length > 0 && (
                  <span>{document.authors.map((a) => a.name).join(', ')}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-iupa-medium">
                <span>Subido {new Date(document.uploadedAt).toLocaleDateString('es-AR')}</span>
                <div className="flex items-center gap-3">
                  {document.files && (
                    <span>{document.files.length} archivo{document.files.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 border-t border-iupa-light pt-3">
            {document.status === 'Published' && (
              <button
                onClick={() => onDownload?.(document.id)}
                className="rounded bg-iupa-green-light px-3 py-1 text-xs font-medium text-iupa-green hover:bg-[#d0ebe5]"
              >
                Descargar
              </button>
            )}
            {(isOwner || isAdmin) && document.status !== 'Published' && (
              <button
                onClick={() => onEdit?.(document.id)}
                className="rounded bg-iupa-light px-3 py-1 text-xs font-medium text-iupa-dark hover:bg-iupa-green-light"
              >
                Editar
              </button>
            )}
          </div>
        </div>
    </div>
  )
}
