import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Document } from '../../types'
import MediaLinkPlayer from '../ui/MediaLinkPlayer'

interface DocumentDetailProps {
  document: Document
}

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

export default function DocumentDetail({ document }: DocumentDetailProps) {
  const [abstractExpanded, setAbstractExpanded] = useState(false)

  const status = statusConfig[document.status] ?? statusConfig.Draft
  const isLink = !!document.sourceUrl
  const primary = isLink ? null : (document.files.find((f) => f.isPrimary) ?? document.files[0])
  const isPdf = primary?.mimeType === 'application/pdf'
  const isImage = primary?.mimeType.startsWith('image/')
  const previewUrl = primary ? `/api/documents/${document.id}/preview/${primary.id}` : null
  const downloadUrl = primary ? `/api/documents/${document.id}/download/${primary.id}` : null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-iupa-dark leading-tight">{document.title}</h1>
          {document.description && (
            <p className="mt-2 text-iupa-medium leading-relaxed">{document.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.class}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.class.split(' ')[0].replace('bg-', 'bg-').replace('50', '500')}`} />
            {status.label}
          </span>
          <span className="inline-flex items-center rounded-full bg-iupa-green-light px-3 py-1 text-xs font-medium text-iupa-green">
            {typeLabels[document.type] || document.type}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        {document.collectionName && (
          <div className="flex items-center gap-2 text-iupa-medium">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <span className="text-iupa-dark">{document.collectionName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-iupa-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-iupa-dark">{document.uploadedByName}</span>
        </div>
        <div className="flex items-center gap-2 text-iupa-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-iupa-dark">
            {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </span>
        </div>
        {document.publishedAt && (
          <div className="flex items-center gap-2 text-iupa-medium">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-iupa-dark">
              Publicado {new Date(document.publishedAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {document.aiMetadata && (
        <div className="rounded-xl border border-iupa-green-light bg-iupa-green-light/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-iupa-green/10 px-2 py-0.5 text-xs font-medium text-iupa-green">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813 2.846a4.5 4.5 0 01-3.09 3.09L2.25 22.5l.375-.375L2.25 22.5l1.846-.813A4.5 4.5 0 019 18.75l.813-2.846" />
              </svg>
              Analizado por IA
            </span>
          </div>

          {document.aiMetadata.summary && (
            <div className="mb-4">
              <h4 className="mb-1 text-sm font-semibold text-iupa-dark">Resumen</h4>
              <p className="text-sm text-iupa-medium leading-relaxed">{document.aiMetadata.summary}</p>
            </div>
          )}

          {document.aiMetadata.extendedAbstract && (
            <div className="mb-4">
              <h4 className="mb-1 text-sm font-semibold text-iupa-dark">Resumen extendido</h4>
              <p className={`text-sm text-iupa-medium leading-relaxed ${abstractExpanded ? '' : 'line-clamp-3'}`}>
                {document.aiMetadata.extendedAbstract}
              </p>
              <button
                onClick={() => setAbstractExpanded((p) => !p)}
                className="mt-1 text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
              >
                {abstractExpanded ? 'Mostrar menos' : 'Mostrar más'}
              </button>
            </div>
          )}

          {document.aiMetadata.suggestedKeywords && document.aiMetadata.suggestedKeywords.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-iupa-dark">Palabras clave sugeridas</h4>
              <div className="flex flex-wrap gap-2">
                {document.aiMetadata.suggestedKeywords.map((kw) => (
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
            {document.aiMetadata.suggestedType && (
              <div>
                <span className="text-xs font-medium text-iupa-medium">Tipo sugerido</span>
                <p className="text-iupa-dark">{document.aiMetadata.suggestedType}</p>
              </div>
            )}
            {document.aiMetadata.suggestedCollection && (
              <div>
                <span className="text-xs font-medium text-iupa-medium">Colección sugerida</span>
                <p className="text-iupa-dark">{document.aiMetadata.suggestedCollection}</p>
              </div>
            )}
            {document.aiMetadata.language && (
              <div>
                <span className="text-xs font-medium text-iupa-medium">Idioma</span>
                <p className="text-iupa-dark">{document.aiMetadata.language}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isLink && document.sourceUrl ? (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-iupa-dark">Enlace externo</h3>
          <div className="overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30 shadow-sm">
            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/50 px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="h-5 w-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <span className="truncate text-sm font-medium text-blue-800">{document.sourceUrl}</span>
              </div>
              <a
                href={document.sourceUrl}
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
          </div>
        </div>
      ) : document.files && document.files.length > 0 && primary && (
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

          {document.files.length > 1 && (
            <div className="mt-3 space-y-1">
              {document.files.filter((f) => f.id !== primary.id).map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-lg border border-iupa-light bg-iupa-white px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="h-4 w-4 shrink-0 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="truncate text-iupa-dark">{file.originalFileName}</span>
                    <span className="shrink-0 text-xs text-iupa-medium">({(file.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                  <a
                    href={`/api/documents/${document.id}/download/${file.id}`}
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

      {document.mediaLinks && document.mediaLinks.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-iupa-dark">Enlaces multimedia</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {document.mediaLinks.map((ml, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-iupa-light bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-iupa-light bg-iupa-light/50 px-4 py-2.5">
                  <span className="truncate text-sm font-medium text-iupa-dark">{ml.label || ml.url}</span>
                  <a
                    href={ml.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
                  >
                    Abrir
                  </a>
                </div>
                <div className={ml.type === 'audio' ? 'px-3 py-2' : 'aspect-video'}>
                  <MediaLinkPlayer link={ml} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 sm:grid-cols-2">
        {document.authors && document.authors.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">Autores</h3>
            <div className="space-y-2">
              {document.authors
                .sort((a, b) => a.order - b.order)
                .map((author) => (
                  <div key={author.id} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-iupa-green-light text-xs font-medium text-iupa-green">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link to={`/autor/${encodeURIComponent(author.name)}`} className="text-sm font-medium text-iupa-dark hover:text-iupa-green hover:underline">{author.name}</Link>
                      {author.orcid && (
                        <p className="text-xs text-iupa-medium">ORCID: {author.orcid}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {document.keywords && document.keywords.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">Palabras clave</h3>
            <div className="flex flex-wrap gap-2">
              {document.keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-iupa-light px-2.5 py-1 text-xs font-medium text-iupa-dark ring-1 ring-iupa-light"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
