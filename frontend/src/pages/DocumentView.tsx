import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDocument, useSearchDocuments } from '../api/documents'
import { useAuthStore } from '../store/authStore'
import type { Document } from '../types'
import DocumentDetail from '../components/documents/DocumentDetail'
import MetadataEditor from '../components/documents/MetadataEditor'
import DublinCorePreview from '../components/documents/DublinCorePreview'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

function useDocumentMetaTags(doc: Document | null) {
  useEffect(() => {
    if (!doc) return

    const baseUrl = window.location.origin
    const docUrl = `${baseUrl}/documents/${doc.id}`
    const pubDate = doc.publicationDate
      ? new Date(doc.publicationDate).toISOString().split('T')[0]
      : doc.publishedAt
      ? new Date(doc.publishedAt).toISOString().split('T')[0]
      : ''

    const authorNames = doc.authors
      .sort((a, b) => a.order - b.order)
      .map((a) => {
        const parts = a.name.trim().split(' ')
        const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
        const firstNames = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]
        return lastName ? `${lastName}, ${firstNames}` : a.name
      })

    const tags: HTMLMetaElement[] = []
    const addMeta = (name: string, content: string) => {
      const meta = document.createElement('meta')
      meta.name = name
      meta.content = content
      document.head.appendChild(meta)
      tags.push(meta)
    }

    // Google Scholar
    addMeta('citation_title', doc.title)
    authorNames.forEach((n) => addMeta('citation_author', n))
    if (pubDate) addMeta('citation_publication_date', pubDate)
    if (doc.files[0]?.originalFileName.endsWith('.pdf')) {
      addMeta('citation_pdf_url', docUrl)
    }
    addMeta('citation_institution', doc.institution || 'IUPA')
    addMeta('citation_language', (doc.aiMetadata?.language || 'es').toLowerCase().substring(0, 2))
    if (doc.keywords.length > 0) addMeta('citation_keywords', doc.keywords.join('; '))

    // Dublin Core
    addMeta('dc.title', doc.title)
    authorNames.forEach((n) => addMeta('dc.creator', n))
    if (doc.advisorName) addMeta('dc.contributor.advisor', doc.advisorName)
    addMeta('dc.publisher', doc.institution || 'IUPA')
    if (pubDate) addMeta('dc.date.issued', pubDate)
    addMeta('dc.type', doc.type)
    const abstractText = doc.abstractEs || doc.description || ''
    if (abstractText) addMeta('dc.description.abstract', abstractText)
    doc.keywords.forEach((kw) => addMeta('dc.subject', kw))
    addMeta('dc.rights.license', doc.license || 'CC BY-NC-ND 4.0')
    addMeta('dc.identifier.uri', docUrl)

    // JSON-LD
    const jsonObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: doc.title,
      author: authorNames.map((name) => ({ '@type': 'Person', name })),
      datePublished: pubDate,
      publisher: { '@type': 'Organization', name: doc.institution || 'IUPA' },
      inLanguage: (doc.aiMetadata?.language || 'es').toLowerCase().substring(0, 2),
      license: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
      isAccessibleForFree: true,
    }
    if (doc.description) jsonObj.description = doc.description
    if (doc.keywords.length > 0) jsonObj.keywords = doc.keywords.join(', ')

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(jsonObj)
    document.head.appendChild(script)

    return () => {
      tags.forEach((t) => t.remove())
      script.remove()
    }
  }, [doc])
}

export default function DocumentView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: doc, isLoading, isError, error } = useDocument(id)
  const [editing, setEditing] = useState(false)
  const [showDublinCore, setShowDublinCore] = useState(false)

  const relatedParams = useMemo(() => ({
    keywords: doc?.keywords,
    pageSize: 5,
  }), [doc?.keywords])

  const { data: relatedDocs } = useSearchDocuments(
    doc?.keywords && doc.keywords.length > 0
      ? relatedParams
      : { pageSize: 0 }
  )

  const isOwner = user?.id === doc?.uploadedByUserId
  const isAdmin = user?.role === 'Admin'

  const relatedList = useMemo(
    () => doc ? ((Array.isArray(relatedDocs) ? relatedDocs : []) as Document[]).filter((d) => d.id !== doc.id) : [],
    [relatedDocs, doc?.id],
  )

  useDocumentMetaTags(doc ?? null)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !doc) {
    const is404 = error && 'response' in error && (error as { response: { status: number } }).response?.status === 404
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-iupa-light/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            {is404 ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            )}
          </svg>
          <p className="text-lg font-medium text-iupa-medium">
            {is404 ? 'Documento no encontrado' : 'Error al cargar el documento'}
          </p>
          <p className="mt-1 text-sm text-iupa-medium">
            {is404 ? 'El documento que buscas no existe o ha sido eliminado' : error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Button>
        <div className="flex gap-2">
          {(isOwner || isAdmin) && !editing && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowDublinCore(true)}>
                Ver Dublin Core
              </Button>
              {doc.status !== 'Published' && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Editar metadatos
                </Button>
              )}
            </>
          )}
          {doc.status === 'Published' && (
            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
              Publicado — solo lectura
            </span>
          )}
        </div>
      </div>

      {editing ? (
        <MetadataEditor
          document={doc}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <div className="rounded-xl border border-iupa-light bg-iupa-white p-6 shadow-sm">
          <DocumentDetail document={doc} />
        </div>
      )}

      {relatedList.length > 0 && (
        <div className="rounded-xl border border-iupa-light bg-iupa-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-iupa-dark">Documentos relacionados</h2>
          <div className="space-y-3">
            {relatedList.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-iupa-light px-4 py-3 hover:bg-iupa-green-light"
              >
                <button
                  onClick={() => navigate(`/documentos/${r.id}`)}
                  className="text-left text-sm font-medium text-iupa-green hover:text-iupa-green-secondary"
                >
                  {r.title}
                </button>
                <span className="text-xs text-iupa-medium">{r.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDublinCore && (
        <DublinCorePreview
          document={doc}
          onClose={() => setShowDublinCore(false)}
        />
      )}
    </div>
  )
}
