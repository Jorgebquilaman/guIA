import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminDocuments } from '../../api/admin'
import client from '../../api/client'
import type { DocumentStatus as DocStatus } from '../../types'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import SearchBar from '../../components/search/SearchBar'
import Pagination from '../../components/search/Pagination'
import { useUiStore } from '../../store/uiStore'

const statusFilters: (DocStatus | '')[] = ['', 'Draft', 'Processing', 'Published', 'Rejected']
const statusLabels: Record<string, string> = {
  '': 'Todos',
  Draft: 'Borrador',
  Processing: 'En proceso',
  Published: 'Publicado',
  Rejected: 'Rechazado',
}

const statusBadgeVariant: Record<string, 'pending' | 'approved' | 'rejected' | 'archived'> = {
  Draft: 'pending',
  Processing: 'pending',
  Published: 'approved',
  Rejected: 'rejected',
}

export default function DocumentsAdmin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const addToast = useUiStore((s) => s.addToast)

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] })
  }, [queryClient])

  const statusFilter = (searchParams.get('status') as DocStatus) || undefined
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const search = searchParams.get('q') ?? ''

  const { data, isLoading, isError, error } = useAdminDocuments(statusFilter, page, 20)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [rejectModal, setRejectModal] = useState<{ open: boolean; docId: string | null }>({ open: false, docId: null })
  const [rejectReason, setRejectReason] = useState('')

  const allItems = useMemo(() => data?.items ?? [], [data])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === allItems.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allItems.map((d) => d.id)))
    }
  }

  const handleBulkApprove = async () => {
    const docs = data?.items.filter((d) => selected.has(d.id) && d.status !== 'Published') ?? []
    if (docs.length === 0) return
    try {
      for (const doc of docs) {
        await client.post(`/documents/${doc.id}/publish`)
      }
      addToast('success', `${docs.length} documento(s) aprobado(s)`)
      setSelected(new Set())
      refetch()
    } catch {
      addToast('error', 'Error al aprobar documentos')
    }
  }

  const handleBulkReject = async () => {
    const docs = data?.items.filter((d) => selected.has(d.id) && d.status !== 'Published') ?? []
    if (docs.length === 0) return
    try {
      for (const doc of docs) {
        await client.post(`/documents/${doc.id}/reject`, { reason: 'Rechazado por administrador' })
      }
      addToast('success', `${docs.length} documento(s) rechazado(s)`)
      setSelected(new Set())
      refetch()
    } catch {
      addToast('error', 'Error al rechazar documentos')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await client.post(`/documents/${id}/publish`)
      addToast('success', 'Documento aprobado')
      refetch()
    } catch {
      addToast('error', 'Error al aprobar documento')
    }
  }

  const handleReject = async () => {
    if (!rejectModal.docId) return
    try {
      await client.post(`/documents/${rejectModal.docId}/reject`, { reason: rejectReason || 'Rechazado por administrador' })
      addToast('success', 'Documento rechazado')
      setRejectModal({ open: false, docId: null })
      setRejectReason('')
      refetch()
    } catch {
      addToast('error', 'Error al rechazar documento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return
    try {
      await client.delete(`/documents/${id}`)
      addToast('success', 'Documento eliminado')
      refetch()
    } catch {
      addToast('error', 'Error al eliminar documento')
    }
  }

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === '') next.delete(k)
        else next.set(k, v)
      }
      if (updates.q !== undefined || updates.status !== undefined) next.set('page', '1')
      return next
    })
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
          <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-iupa-dark">Gestión de documentos</h1>
          <p className="text-xs text-iupa-medium">Administrá los documentos del repositorio</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 sm:max-w-xs">
          <SearchBar
            value={search}
            onChange={(q) => updateParams({ q: q || undefined })}
            placeholder="Buscar documentos..."
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((s) => {
            const isActive = (statusFilter ?? '') === s
            return (
              <button
                key={s}
                onClick={() => updateParams({ status: s || undefined })}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-iupa-green text-white shadow-sm'
                    : 'bg-iupa-light text-iupa-medium hover:bg-iupa-green-light hover:text-iupa-green-secondary'
                }`}
              >
                {s === '' && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                )}
                {s === 'Draft' && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                )}
                {s === 'Processing' && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                )}
                {s === 'Published' && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {s === 'Rejected' && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {statusLabels[s]}
              </button>
            )
          })}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-iupa-green-light bg-iupa-green-light/60 px-5 py-3 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-iupa-green">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-iupa-green">
            {selected.size} documento{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={handleBulkApprove}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Aprobar
            </Button>
            <Button size="sm" variant="danger" onClick={handleBulkReject}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rechazar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </Button>
          </div>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-800">Error al cargar documentos</p>
            <p className="mt-1 text-xs text-red-600">
              {error instanceof Error ? error.message : 'Error al cargar documentos'}
            </p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
              <svg className="h-7 w-7 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-iupa-dark">No hay documentos</p>
            <p className="mt-1 text-xs text-iupa-medium">No hay documentos que coincidan con los filtros</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-iupa-light">
              <div className="flex items-center gap-4 px-5 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.size === allItems.length && allItems.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
                />
                <span className="text-xs font-medium text-iupa-medium">
                  {selected.size === allItems.length && allItems.length > 0
                    ? `${allItems.length} seleccionados`
                    : 'Seleccionar todo'}
                </span>
              </div>
              {allItems.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-5 py-4 transition-all duration-150 hover:bg-iupa-green-light/40"
                >
                  <div className="flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      checked={selected.has(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="shrink-0">
                      {(doc.hasCoverImage || doc.files?.[0]?.hasThumbnail) ? (
                        <img
                          src={`/api/documents/${doc.id}/thumbnail`}
                          alt=""
                          className="h-12 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-10 items-center justify-center rounded bg-iupa-light">
                          <svg className="h-5 w-5 text-iupa-medium/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => navigate(`/app/documents/${doc.id}`)}
                        className="text-sm font-semibold text-iupa-dark hover:text-iupa-green transition-colors"
                      >
                        {doc.title}
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-iupa-light px-2 py-0.5 text-[11px] font-medium text-iupa-medium">
                          {doc.type}
                        </span>
                        <span className="text-[11px] text-iupa-medium">
                          {new Date(doc.uploadedAt).toLocaleDateString('es')}
                        </span>
                        <span className="text-[11px] text-iupa-medium">
                          por {doc.uploadedByName}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Badge variant={statusBadgeVariant[doc.status] ?? 'pending'}>
                        {statusLabels[doc.status] ?? doc.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {doc.status !== 'Published' && (
                      <button
                        onClick={() => handleApprove(doc.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        title="Aprobar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Aprobar
                      </button>
                    )}
                    {doc.status !== 'Published' && (
                      <button
                        onClick={() => setRejectModal({ open: true, docId: doc.id })}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Rechazar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Rechazar
                      </button>
                    )}
                    {doc.status !== 'Published' && (
                      <button
                        onClick={() => navigate(`/app/documents/${doc.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-iupa-green-secondary hover:bg-iupa-green-light hover:text-iupa-green transition-colors"
                        title="Editar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Editar
                      </button>
                    )}
                    {doc.status !== 'Published' && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {data && data.totalCount > 20 && (
              <div className="px-5 py-4">
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(data.totalCount / data.pageSize)}
                  totalCount={data.totalCount}
                  onPageChange={(p) => updateParams({ page: String(p) })}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        open={rejectModal.open}
        onClose={() => { setRejectModal({ open: false, docId: null }); setRejectReason('') }}
        title="Motivo del rechazo"
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">Motivo del rechazo</p>
              <p className="mt-0.5 text-xs text-red-600">El autor recibirá una notificación con el motivo</p>
            </div>
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indica el motivo del rechazo..."
            rows={4}
            className="w-full rounded-lg border border-iupa-light px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:outline-none transition-all"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setRejectModal({ open: false, docId: null }); setRejectReason('') }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleReject}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rechazar documento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
