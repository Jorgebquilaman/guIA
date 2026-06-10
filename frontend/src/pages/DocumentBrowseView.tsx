import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDocument } from '../api/documents'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'
import DocumentDetail from '../components/documents/DocumentDetail'
import DublinCorePreview from '../components/documents/DublinCorePreview'
import Button from '../components/ui/Button'

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
          {(isOwner || isAdmin) && (
            <Button variant="secondary" size="sm" onClick={() => setShowDublinCore(true)}>
              Ver Dublin Core
            </Button>
          )}
          {doc.status === 'Published' && (
            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
              Publicado — solo lectura
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-iupa-light bg-iupa-white p-6 shadow-sm">
        <DocumentDetail document={doc} />
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
