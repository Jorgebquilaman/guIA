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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-iupa-green-light">
          <svg className="h-10 w-10 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="mb-1 text-xl font-bold text-iupa-dark">Explorar colecciones</h2>
        <p className="text-sm text-iupa-medium max-w-xs mx-auto leading-relaxed">
          Seleccioná una colección del panel izquierdo para explorar sus documentos y recursos.
        </p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-iupa-light bg-white p-4">
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

  const { data: collections, isLoading: collectionsLoading } = useCollections()
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
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-iupa-light bg-white lg:block">
        <div className="sticky top-0 z-10 border-b border-iupa-light bg-white px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-iupa-green-light">
              <svg className="h-4 w-4 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-iupa-dark">Colecciones</h2>
          </div>
        </div>
        <div className="p-3">
          <CollectionTree
            selectedCollectionId={selectedCollectionId ?? undefined}
            onSelect={handleCollectionSelect}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-iupa-light/30">
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
          <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div className="rounded-xl border border-iupa-light bg-white p-6 shadow-sm">
              <CollectionBreadcrumb collectionId={selectedCollection.id} />
              <h1 className="mt-3 text-2xl font-bold text-iupa-dark">{selectedCollection.name}</h1>
              {selectedCollection.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-iupa-medium">{selectedCollection.description}</p>
              )}
              <div className="mt-3 flex items-center gap-3 text-sm text-iupa-medium">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {selectedCollection.documentCount} documento{selectedCollection.documentCount !== 1 ? 's' : ''}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedCollection.isPublic
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-iupa-light text-iupa-medium'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedCollection.isPublic ? 'bg-emerald-500' : 'bg-iupa-medium'}`} />
                  {selectedCollection.isPublic ? 'Pública' : 'Privada'}
                </span>
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
                      onTitleClick={(id) => navigate(`/browse/${id}`)}
                      onDownload={(id) => navigate(`/browse/${id}`)}
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
