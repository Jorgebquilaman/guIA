import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Document } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { getGoogleDriveEmbedUrl } from '../../utils/gdrive'

const MEDIA_EXTENSIONS = {
  video: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'],
  audio: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.wma'],
}

function getUrlType(url: string): 'gdrive' | 'video' | 'audio' | 'other' {
  if (getGoogleDriveEmbedUrl(url)) return 'gdrive'
  const lower = url.toLowerCase()
  const path = lower.split('?')[0]
  if (MEDIA_EXTENSIONS.video.some((ext) => path.endsWith(ext))) return 'video'
  if (MEDIA_EXTENSIONS.audio.some((ext) => path.endsWith(ext))) return 'audio'
  return 'other'
}

interface DocumentCardProps {
  document: Document
  onTitleClick?: (id: string) => void
  onDownload?: (id: string) => void
  onEdit?: (id: string) => void
}

const typeLabels: Record<string, string> = {
  Article: 'Artículo',
  Thesis: 'Tesis',
  Dataset: 'Dataset',
  Software: 'Software',
  Link: 'Enlace',
  Other: 'Otro',
  ConferenceDocument: 'Conferencia',
  Book: 'Libro',
}

const statusLabels: Record<string, string> = {
  Published: 'Publicado',
  Draft: 'Borrador',
  Processing: 'En proceso',
  Rejected: 'Rechazado',
}

const typeColors: Record<string, string> = {
  Article: 'bg-iupa-green-light text-iupa-green',
  Thesis: 'bg-purple-100 text-purple-800',
  Dataset: 'bg-green-100 text-green-800',
  Software: 'bg-orange-100 text-orange-800',
  Link: 'bg-blue-100 text-blue-800',
  Other: 'bg-gray-100 text-gray-800',
  ConferenceDocument: 'bg-pink-100 text-pink-800',
  Book: 'bg-indigo-100 text-indigo-800',
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
  const isLink = !!document.sourceUrl
  const hasThumbnail = !isLink && (document.hasCoverImage || document.files?.[0]?.hasThumbnail)
  const primaryFile = isLink ? null : document.files?.[0]
  const [lightbox, setLightbox] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const urlType = document.sourceUrl ? getUrlType(document.sourceUrl) : 'other'
  const gdriveEmbedUrl = urlType === 'gdrive' && document.sourceUrl ? getGoogleDriveEmbedUrl(document.sourceUrl) : null
  const previewUrl = primaryFile?.mimeType?.startsWith('image/')
    ? `/api/documents/${document.id}/preview/${primaryFile.id}`
    : `/api/documents/${document.id}/thumbnail`

  return (
    <>
    <div className="overflow-hidden rounded-lg border border-iupa-light border-l-4 border-l-iupa-green bg-iupa-white shadow-sm transition hover:shadow-md">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="shrink-0">
              {isLink ? (
                <div className="flex h-24 w-20 items-center justify-center rounded bg-blue-50">
                  <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
              ) : hasThumbnail ? (
                <button onClick={() => setLightbox(true)} className="group relative">
                  <img
                    src={`/api/documents/${document.id}/thumbnail`}
                    alt=""
                    className="h-24 w-20 rounded object-cover transition group-hover:ring-2 group-hover:ring-iupa-green/50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded bg-black/0 transition group-hover:bg-black/20">
                    <svg className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                    </svg>
                  </div>
                </button>
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
                    {typeLabels[document.type] || document.type}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[document.status] || ''}`}
                  >
                    {statusLabels[document.status] || document.status}
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
                  <span>
                    {document.authors.map((a, i) => (
                      <span key={a.id}>
                        {i > 0 && ', '}
                        <Link to={`/autor/${encodeURIComponent(a.name)}`} className="hover:text-iupa-green hover:underline">
                          {a.name}
                        </Link>
                      </span>
                    ))}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-iupa-medium">
                <span>Subido {new Date(document.uploadedAt).toLocaleDateString('es-AR')}</span>
                <div className="flex items-center gap-3">
                  {!isLink && document.files && (
                    <span>{document.files.length} archivo{document.files.length !== 1 ? 's' : ''}</span>
                  )}
                  {isLink && document.sourceUrl && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                      Enlace externo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 border-t border-iupa-light pt-3">
            {document.status === 'Published' && isLink && document.sourceUrl && (
              <>
                {(urlType === 'gdrive' || urlType === 'video' || urlType === 'audio') && (
                  <button
                    onClick={() => setPreviewOpen((p) => !p)}
                    className="inline-flex items-center gap-1.5 rounded bg-iupa-green-light px-3 py-1 text-xs font-medium text-iupa-green hover:bg-[#d0ebe5]"
                  >
                    {previewOpen ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {previewOpen ? 'Cerrar' : 'Reproducir'}
                  </button>
                )}
                <a
                  href={document.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  Abrir enlace externo
                </a>
              </>
            )}
            {document.status === 'Published' && !isLink && (
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

          {previewOpen && document.sourceUrl && urlType === 'gdrive' && gdriveEmbedUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-iupa-light">
              <iframe
                src={gdriveEmbedUrl}
                className="aspect-video w-full"
                title="Vista previa de Google Drive"
                allow="autoplay"
              />
            </div>
          )}
          {previewOpen && document.sourceUrl && urlType === 'video' && (
            <div className="mt-3 overflow-hidden rounded-lg border border-iupa-light">
              <video controls className="w-full" style={{ maxHeight: 400 }}>
                <source src={document.sourceUrl} />
              </video>
            </div>
          )}
          {previewOpen && document.sourceUrl && urlType === 'audio' && (
            <div className="mt-3 rounded-lg border border-iupa-light bg-iupa-light/30 p-4">
              <audio controls className="w-full">
                <source src={document.sourceUrl} />
              </audio>
            </div>
          )}
        </div>
    </div>

      {lightbox && hasThumbnail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={previewUrl}
            alt={document.title}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
