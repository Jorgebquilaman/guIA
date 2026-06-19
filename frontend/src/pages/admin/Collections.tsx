import { useState } from 'react'
import { useCollections, useCreateCollection, useUpdateCollection, useDeleteCollection } from '../../api/collections'
import { useUiStore } from '../../store/uiStore'
import type { Collection } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

function TreeNode({
  collection,
  depth,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  collection: Collection
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  onEdit: (c: Collection) => void
  onDelete: (c: Collection) => void
}) {
  const hasChildren = collection.subCollections && collection.subCollections.length > 0
  const isExpanded = expanded.has(collection.id)

  return (
    <li className="relative">
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-iupa-green-light/60"
          style={{ left: `${depth * 24 + 4}px` }}
        />
      )}
      <div
        className="relative flex items-center gap-2 px-4 py-3 transition-all duration-150 hover:bg-iupa-green-light/40"
        style={{ paddingLeft: `${depth * 24 + 48}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(collection.id)}
            className="absolute left-0 flex h-6 w-6 items-center justify-center rounded text-iupa-medium hover:bg-iupa-green-light hover:text-iupa-green transition-colors"
            style={{ left: `${depth * 24 + 16}px` }}
          >
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span
            className="absolute left-0 h-3 w-3 text-iupa-light"
            style={{ left: `${depth * 24 + 22}px` }}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </span>
        )}
        <div className="flex shrink-0 items-center">
          {hasChildren && isExpanded ? (
            <svg className="h-5 w-5 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-iupa-dark truncate block">{collection.name}</span>
          {collection.description && (
            <span className="text-xs text-iupa-medium truncate block leading-tight mt-0.5">{collection.description}</span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-iupa-green-light/60 px-2 py-0.5 text-[11px] font-medium text-iupa-green-secondary">
          {collection.documentCount} doc{collection.documentCount !== 1 ? 's' : ''}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          collection.isPublic ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {collection.isPublic ? 'Pública' : 'Privada'}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(collection)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-iupa-green-secondary hover:bg-iupa-green-light transition-colors"
            title="Editar"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Editar
          </button>
          <button
            onClick={() => onDelete(collection)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <ul>
          {collection.subCollections.map((child) => (
            <TreeNode key={child.id} collection={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function CollectionsAdmin() {
  const { data: collections, isLoading, isError } = useCollections()
  const createMutation = useCreateCollection()
  const updateMutation = useUpdateCollection()
  const deleteMutation = useDeleteCollection()
  const addToast = useUiStore((s) => s.addToast)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Collection | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const resetForm = () => {
    setName('')
    setDescription('')
    setParentId('')
    setIsPublic(true)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      await createMutation.mutateAsync({ name: name.trim(), description, parentCollectionId: parentId || null, isPublic })
      addToast('success', 'Colección creada exitosamente')
      setCreateOpen(false)
      resetForm()
    } catch {
      addToast('error', 'Error al crear colección')
    }
  }

  const handleEdit = async () => {
    if (!editTarget || !name.trim()) return
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, name: name.trim(), description, isPublic })
      addToast('success', 'Colección actualizada')
      setEditTarget(null)
      resetForm()
    } catch {
      addToast('error', 'Error al actualizar colección')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      addToast('success', 'Colección eliminada')
      setDeleteTarget(null)
    } catch {
      addToast('error', 'Error al eliminar colección')
    }
  }

  const roots = collections?.filter((c) => !c.parentCollectionId) ?? []

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">Error al cargar colecciones</div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
            <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-iupa-dark">Colecciones</h1>
            <p className="text-xs text-iupa-medium">Gestioná las colecciones y su jerarquía</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear colección
        </Button>
      </div>

      <Card>
        {roots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
              <svg className="h-7 w-7 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-iupa-dark">No hay colecciones</p>
            <p className="mt-1 text-xs text-iupa-medium">Creá la primera colección para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-iupa-light">
            {roots.map((root) => (
              <TreeNode key={root.id} collection={root} depth={0} expanded={expanded} onToggle={(id) => setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })} onEdit={(c) => { setEditTarget(c); setName(c.name); setDescription(c.description); setIsPublic(c.isPublic) }} onDelete={(c) => setDeleteTarget(c)} />
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva colección"
        size="lg"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg border border-iupa-green-light bg-iupa-green-light/30 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-iupa-green">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-iupa-green-secondary">Nueva colección</p>
              <p className="text-xs text-iupa-medium">Completá los datos para crear una colección</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la colección"
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              placeholder="Descripción opcional"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              Colección padre
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            >
              <option value="">Ninguna (raíz)</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-iupa-light px-4 py-3 text-sm text-iupa-dark hover:bg-iupa-green-light/20 transition-colors">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
            />
            <div>
              <span className="font-medium">Colección pública</span>
              <p className="text-xs text-iupa-medium">Visible para todos los usuarios del sistema</p>
            </div>
          </label>
          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => { setEditTarget(null); resetForm() }}
        title="Editar colección"
        size="lg"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg border border-iupa-green-light bg-iupa-green-light/30 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-iupa-green-secondary">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-iupa-green-secondary">Editar colección</p>
              <p className="text-xs text-iupa-medium">Modificá los datos de la colección</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la colección"
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              placeholder="Descripción opcional"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-iupa-light px-4 py-3 text-sm text-iupa-dark hover:bg-iupa-green-light/20 transition-colors">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
            />
            <div>
              <span className="font-medium">Colección pública</span>
              <p className="text-xs text-iupa-medium">Visible para todos los usuarios del sistema</p>
            </div>
          </label>
          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            <Button variant="ghost" onClick={() => { setEditTarget(null); resetForm() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button onClick={handleEdit} loading={updateMutation.isPending}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar colección"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">
                ¿Eliminar la colección <strong>{deleteTarget?.name}</strong>?
              </p>
              {deleteTarget && deleteTarget.documentCount > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  Tiene <strong>{deleteTarget.documentCount}</strong> documento{deleteTarget.documentCount !== 1 ? 's' : ''} asociado{deleteTarget.documentCount !== 1 ? 's' : ''}. Esta acción no se puede deshacer.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
