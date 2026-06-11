import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDocument } from '../api/documents'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'
import DublinCorePreview from '../components/documents/DublinCorePreview'
import Button from '../components/ui/Button'
import { isGoogleDriveUrl, getGoogleDriveEmbedUrl } from '../utils/gdrive'

const typeLabels: Record<string, string> = {
  Article: 'Artículo',
  Thesis: 'Tesis',
  Dataset: 'Dataset',
  Software: 'Software',
  Link: 'Enlace',
  Other: 'Otro',
}

const statusConfig: Record<string, { label: string; class: string }> = {
  Published: { label: 'Publicado', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Draft: { label: 'Borrador', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  Processing: { label: 'En proceso', class: 'bg-sky-50 text-sky-700 border-sky-200' },
  Rejected: { label: 'Rechazado', class: 'bg-red-50 text-red-700 border-red-200' },
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function AIAnalysisSection({ doc }: { doc: NonNullable<ReturnType<typeof useDocument>['data']> }) {
  const [abstractExpanded, setAbstractExpanded] = useState(false)
  const ai = doc.aiMetadata
  if (!ai) return null

  return (
    <div className="rounded-xl border border-iupa-green-light bg-iupa-green-light/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-iupa-green/10 px-2 py-0.5 text-xs font-medium text-iupa-green">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813 2.846a4.5 4.5 0 01-3.09 3.09L2.25 22.5l.375-.375L2.25 22.5l1.846-.813A4.5 4.5 0 019 18.75l.813-2.846" />
          </svg>
          Analizado por IA
        </span>
      </div>

      {ai.summary && (
        <div className="mb-4">
          <h4 className="mb-1 text-sm font-semibold text-iupa-dark">Resumen</h4>
          <p className="text-sm text-iupa-medium leading-relaxed">{ai.summary}</p>
        </div>
      )}

      {ai.extendedAbstract && (
        <div className="mb-4">
          <h4 className="mb-1 text-sm font-semibold text-iupa-dark">Resumen extendido</h4>
          <p className={`text-sm text-iupa-medium leading-relaxed ${abstractExpanded ? '' : 'line-clamp-3'}`}>
            {ai.extendedAbstract}
          </p>
          <button
            onClick={() => setAbstractExpanded((p) => !p)}
            className="mt-1 text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
          >
            {abstractExpanded ? 'Mostrar menos' : 'Mostrar más'}
          </button>
        </div>
      )}

      {ai.suggestedKeywords && ai.suggestedKeywords.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-iupa-dark">Palabras clave sugeridas</h4>
          <div className="flex flex-wrap gap-2">
            {ai.suggestedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-iupa-dark shadow-sm ring-1 ring-iupa-light"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-sm">
        {ai.suggestedType && (
          <div>
            <span className="text-xs font-medium text-iupa-medium">Tipo sugerido</span>
            <p className="text-iupa-dark">{ai.suggestedType}</p>
          </div>
        )}
        {ai.suggestedCollection && (
          <div>
            <span className="text-xs font-medium text-iupa-medium">Colección sugerida</span>
            <p className="text-iupa-dark">{ai.suggestedCollection}</p>
          </div>
        )}
        {ai.language && (
          <div>
            <span className="text-xs font-medium text-iupa-medium">Idioma</span>
            <p className="text-iupa-dark">{ai.language}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AuthorsSection({ authors }: { authors: NonNullable<ReturnType<typeof useDocument>['data']>['authors'] }) {
  if (!authors || authors.length === 0) return null
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">Autores</h3>
      <div className="space-y-2">
        {authors
          .sort((a, b) => a.order - b.order)
          .map((author) => (
            <div key={author.id} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-iupa-green-light text-xs font-medium text-iupa-green">
                {author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-iupa-dark">{author.name}</p>
                {author.orcid && (
                  <p className="text-xs text-iupa-medium">ORCID: {author.orcid}</p>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default function DocumentBrowseView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: doc, isLoading, isError, error } = useDocument(id)
  const user = useAuthStore((s) => s.user)
  const [showDublinCore, setShowDublinCore] = useState(false)

  const isOwner = user?.id === doc?.uploadedByUserId
  const isAdmin = user?.role === 'Admin'

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !doc) {
    const is404 = error && 'response' in error && (error as { response: { status: number } }).response?.status === 404
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-iupa-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            {is404 ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            )}
          </svg>
          <p className="text-lg font-medium text-iupa-medium">
            {is404 ? 'Documento no encontrado' : 'Error al cargar el documento'}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </div>
    )
  }

  const hasSourceUrl = !!doc.sourceUrl
  const primary = hasSourceUrl ? null : (doc.files.find((f) => f.isPrimary) ?? doc.files[0])
  const isPdf = primary?.mimeType === 'application/pdf'
  const isImage = primary?.mimeType.startsWith('image/')
  const previewUrl = primary ? `/api/documents/${doc.id}/preview/${primary.id}` : null
  const downloadUrl = primary ? `/api/documents/${doc.id}/download/${primary.id}` : null
  const status = statusConfig[doc.status] ?? statusConfig.Draft

  return (
    <div className="min-h-full bg-gradient-to-b from-iupa-green-light/30 via-white to-white">
      <div className="sticky top-0 z-10 border-b border-iupa-light/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-iupa-medium">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-iupa-medium hover:bg-iupa-light transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <span className="text-iupa-light">/</span>
            <Link to="/app/browse" className="hover:text-iupa-green transition-colors">Colecciones</Link>
            {doc.collectionName && (
              <>
                <span className="text-iupa-light">/</span>
                <span className="text-iupa-dark font-medium truncate max-w-[200px]">{doc.collectionName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(isOwner || isAdmin) && (
              <button
                onClick={() => setShowDublinCore(true)}
                className="flex items-center gap-1.5 rounded-lg border border-iupa-light px-3 py-1.5 text-xs font-medium text-iupa-medium hover:border-iupa-green hover:text-iupa-green transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dublin Core
              </button>
            )}
            {hasSourceUrl && (
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                ABRIR ENLACE
              </a>
            )}
            {downloadUrl && (
              <a
                href={downloadUrl}
                className="flex items-center gap-1.5 rounded-lg bg-iupa-green px-4 py-1.5 text-xs font-bold text-white hover:bg-iupa-green-secondary transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                DESCARGAR
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="overflow-hidden rounded-2xl border border-iupa-light bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-[#2D7A6B] to-iupa-green px-8 py-10 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.class.includes('emerald') ? 'border-emerald-400/50 bg-emerald-500/20 text-white' : status.class.includes('amber') ? 'border-amber-400/50 bg-amber-500/20 text-white' : status.class.includes('sky') ? 'border-sky-400/50 bg-sky-500/20 text-white' : 'border-red-400/50 bg-red-500/20 text-white'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.class.includes('emerald') ? 'bg-emerald-400' : status.class.includes('amber') ? 'bg-amber-400' : status.class.includes('sky') ? 'bg-sky-400' : 'bg-red-400'}`} />
                  {status.label}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                  {typeLabels[doc.type] || doc.type}
                </span>
                <span className="ml-auto text-xs text-white/50">
                  ID: {doc.id.slice(0, 8)}...
                </span>
              </div>
              <h1 className="text-3xl font-bold leading-tight tracking-tight">{doc.title}</h1>
              {doc.description && (
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/75">{doc.description}</p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/60">
                {doc.uploadedByName && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    {doc.uploadedByName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Subido {formatDate(doc.uploadedAt)}
                </span>
                {doc.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Publicado {formatDate(doc.publishedAt)}
                  </span>
                )}
                {doc.collectionName && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    {doc.collectionName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {doc.keywords && doc.keywords.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {doc.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full bg-iupa-green-light/60 px-3 py-1 text-xs font-medium text-iupa-green ring-1 ring-iupa-green/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-8">
              {doc.abstractEs && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">Resumen</h3>
                  <div className="rounded-xl border border-iupa-light bg-iupa-light/30 p-5">
                    <p className="text-sm text-iupa-dark leading-relaxed whitespace-pre-line">{doc.abstractEs}</p>
                  </div>
                </div>
              )}

              <AIAnalysisSection doc={doc} />

              {hasSourceUrl ? (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-iupa-dark">Enlace externo</h3>
                  <div className="overflow-hidden rounded-xl border border-iupa-light bg-iupa-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-iupa-light bg-iupa-light/50 px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="h-5 w-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        <span className="truncate text-sm font-medium text-iupa-dark">{doc.sourceUrl}</span>
                      </div>
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        Abrir enlace externo
                      </a>
                    </div>
                    <div className="bg-iupa-white">
                      {(() => {
                        const gdriveEmbedUrl = getGoogleDriveEmbedUrl(doc.sourceUrl!)
                        if (gdriveEmbedUrl) {
                          return (
                            <iframe
                              src={gdriveEmbedUrl}
                              className="h-[600px] w-full"
                              title="Vista previa de Google Drive"
                              allow="autoplay"
                            />
                          )
                        }
                        return (
                          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-iupa-medium">
                            <svg className="h-16 w-16 text-iupa-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                            <p className="text-sm">Vista previa no disponible para este enlace</p>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ) : doc.files && doc.files.length > 0 && primary && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-iupa-dark">Archivos</h3>
                  <div className="overflow-hidden rounded-xl border border-iupa-light bg-iupa-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-iupa-light bg-iupa-light/50 px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="h-5 w-5 shrink-0 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="truncate text-sm font-medium text-iupa-dark">{primary.originalFileName}</span>
                        <span className="shrink-0 text-xs text-iupa-medium">({(primary.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                      <a
                        href={downloadUrl!}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-iupa-green px-3 py-1.5 text-xs font-medium text-white hover:bg-iupa-green-secondary transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Descargar
                      </a>
                    </div>
                    <div className="bg-iupa-white">
                      {isPdf ? (
                        <iframe src={previewUrl!} className="h-[600px] w-full" title="Vista previa del documento" />
                      ) : isImage ? (
                        <img src={previewUrl!} alt={primary.originalFileName} className="mx-auto max-h-[600px] object-contain p-4" />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-iupa-medium">
                          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <p className="text-sm">Vista previa no disponible para este tipo de archivo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {doc.files.length > 1 && (
                    <div className="mt-3 space-y-1">
                      {doc.files.filter((f) => f.id !== primary.id).map((file) => (
                        <div key={file.id} className="flex items-center justify-between rounded-lg border border-iupa-light bg-iupa-white px-4 py-2.5 text-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="h-4 w-4 shrink-0 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="truncate text-iupa-dark">{file.originalFileName}</span>
                            <span className="shrink-0 text-xs text-iupa-medium">({(file.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)</span>
                          </div>
                          <a
                            href={`/api/documents/${doc.id}/download/${file.id}`}
                            className="shrink-0 text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
                          >
                            Descargar
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <AuthorsSection authors={doc.authors} />
            </div>
          </div>
        </div>
      </div>

      {showDublinCore && (
        <DublinCorePreview
          document={doc}
          onClose={() => setShowDublinCore(false)}
        />
      )}
    </div>
  )
}
