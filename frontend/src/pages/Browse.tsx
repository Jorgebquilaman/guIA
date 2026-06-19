import { useState, useMemo } from 'react'
import { useCollections, useCollection } from '../api/collections'
import { useSearchDocuments } from '../api/documents'
import type { Document } from '../types'
import CollectionTree from '../components/collections/CollectionTree'
import CollectionBreadcrumb from '../components/collections/CollectionBreadcrumb'
import DocumentCard from '../components/documents/DocumentCard'
import Pagination from '../components/search/Pagination'
import Spinner from '../components/ui/Spinner'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 12

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-iupa-green-light to-iupa-green/10 shadow-sm">
          <svg className="h-10 w-10 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-iupa-dark">Explorar colecciones</h2>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-iupa-medium">
          Seleccioná una colección del panel izquierdo para explorar sus documentos y recursos académicos.
        </p>
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-iupa-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
          <span>También podés buscar desde la barra de búsqueda</span>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-iupa-light bg-white p-4 shadow-sm">
          <div className="flex gap-4">
            <div className="h-24 w-20 shrink-0 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="flex gap-2">
                <div className="h-5 w-14 rounded-full bg-slate-100" />
                <div className="h-5 w-14 rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 border-t border-iupa-light pt-3">
            <div className="h-7 w-20 rounded bg-slate-200" />
            <div className="h-7 w-16 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Browse() {
  const navigate = useNavigate()
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { isLoading: collectionsLoading } = useCollections()
  const { data: selectedCollection, isLoading: collectionLoading } = useCollection(selectedCollectionId ?? undefined)

  const searchParams = useMemo(() => ({
    collectionId: selectedCollectionId ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [selectedCollectionId, page])

  const { data: docsData, isLoading: docsLoading } = useSearchDocuments(searchParams)

  const docs = useMemo(() => (Array.isArray(docsData) ? docsData : []) as Document[], [docsData])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((selectedCollection?.documentCount ?? 0) / PAGE_SIZE)), [selectedCollection?.documentCount])

  const handleCollectionSelect = (collection: { id: string }) => {
    setSelectedCollectionId(collection.id)
    setPage(1)
    setSidebarOpen(false)
  }

  if (collectionsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-20 w-72 shrink-0 overflow-y-auto border-r border-iupa-light bg-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="sticky top-0 z-10 border-b border-iupa-light bg-white/80 backdrop-blur-md px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-iupa-green-light">
                <svg className="h-4 w-4 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-iupa-dark">Colecciones</h2>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-iupa-medium hover:bg-iupa-light lg:hidden">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-3">
          <CollectionTree
            selectedCollectionId={selectedCollectionId ?? undefined}
            onSelect={handleCollectionSelect}
          />
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-iupa-green-light/30 via-white to-white">
        {!selectedCollectionId ? (
          <EmptyState />
        ) : collectionLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : !selectedCollection ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-iupa-medium">Colección no encontrada</p>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-6 p-6">
            <div className="overflow-hidden rounded-2xl border border-iupa-light bg-white shadow-sm">
              <div className="relative bg-gradient-to-br from-[#2D7A6B] to-iupa-green px-6 py-8 text-white">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm hover:bg-white/20 transition-colors lg:hidden"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                      Colecciones
                    </button>
                    <CollectionBreadcrumb collectionId={selectedCollection.id} />
                    <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">{selectedCollection.name}</h1>
                    {selectedCollection.description && (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">{selectedCollection.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/60">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        {selectedCollection.documentCount} documento{selectedCollection.documentCount !== 1 ? 's' : ''}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        selectedCollection.isPublic
                          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/20 bg-white/10 text-white/60'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedCollection.isPublic ? 'bg-emerald-400' : 'bg-white/40'}`} />
                        {selectedCollection.isPublic ? 'Pública' : 'Privada'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {docsLoading ? (
              <LoadingSkeleton />
            ) : docs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {docs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onTitleClick={(id) => navigate(`/app/browse/${id}`)}
                      onDownload={(id) => navigate(`/app/browse/${id}`)}
                      onEdit={(id) => navigate(`/app/documents/${id}`)}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalCount={selectedCollection.documentCount}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-iupa-light bg-white px-6 py-16 text-center shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-light">
                  <svg className="h-7 w-7 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-base font-medium text-iupa-dark">No hay documentos en esta colección</p>
                <p className="mt-1 text-sm text-iupa-medium">Esta colección aún no contiene documentos públicos</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
