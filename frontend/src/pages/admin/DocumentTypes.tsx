import { useState } from 'react'
import { useDocumentTypes, useCreateDocumentType, useUpdateDocumentType, useDeleteDocumentType } from '../../api/admin'
import { useUiStore } from '../../store/uiStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

interface FormState {
  id?: string
  name: string
  label: string
  sortOrder: number
}

const emptyForm: FormState = { name: '', label: '', sortOrder: 0 }

export default function DocumentTypes() {
  const { data: types, isLoading } = useDocumentTypes()
  const createMutation = useCreateDocumentType()
  const updateMutation = useUpdateDocumentType()
  const deleteMutation = useDeleteDocumentType()
  const addToast = useUiStore((s) => s.addToast)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim() || !form.label.trim()) return
    try {
      if (editing && form.id) {
        await updateMutation.mutateAsync({ id: form.id, name: form.name, label: form.label, sortOrder: form.sortOrder })
        addToast('success', 'Tipo actualizado')
      } else {
        await createMutation.mutateAsync({ name: form.name, label: form.label, sortOrder: form.sortOrder })
        addToast('success', 'Tipo creado')
      }
      setForm(emptyForm)
      setEditing(false)
    } catch {
      addToast('error', 'Error al guardar el tipo')
    }
  }

  const handleEdit = (t: NonNullable<typeof types>[number]) => {
    setForm({ id: t.id, name: t.name, label: t.label, sortOrder: t.sortOrder })
    setEditing(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este tipo de documento?')) return
    try {
      await deleteMutation.mutateAsync(id)
      addToast('success', 'Tipo eliminado')
    } catch {
      addToast('error', 'Error al eliminar')
    }
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
          <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-iupa-dark">Tipos de documento</h1>
          <p className="text-xs text-iupa-medium">Gestioná los tipos de documento y su orden de visualización</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-iupa-light bg-iupa-green-light/30 px-6 py-3">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <span className="text-sm font-semibold text-iupa-green-secondary">Editar tipo</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-sm font-semibold text-iupa-green">Nuevo tipo</span>
              </>
            )}
          </div>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Nombre interno
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Article"
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                </svg>
                Etiqueta visible
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Artículo"
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 6h16.5M3.75 6h16.5" />
                </svg>
                Orden
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            {editing && (
              <Button variant="ghost" onClick={handleCancel}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim() || !form.label.trim()}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {editing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                )}
              </svg>
              {editing ? 'Actualizar' : 'Agregar tipo'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <h2 className="text-sm font-semibold text-iupa-dark">Tipos existentes</h2>
          <span className="rounded-full bg-iupa-green-light px-2.5 py-0.5 text-xs font-medium text-iupa-green">
            {types?.length ?? 0}
          </span>
        </div>

        {types?.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
                <svg className="h-7 w-7 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-iupa-dark">No hay tipos configurados</p>
              <p className="mt-1 text-xs text-iupa-medium">Creá tu primer tipo de documento usando el formulario de arriba</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {types?.map((t) => (
              <Card key={t.id} className="overflow-hidden !p-0">
                <div className="flex items-center justify-between border-l-4 border-iupa-green px-5 py-4 transition-all duration-150 hover:bg-iupa-green-light/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-iupa-green text-sm font-bold text-white shadow-sm">
                      {t.sortOrder}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-iupa-dark">{t.label}</span>
                      <span className="ml-2 rounded-full bg-iupa-light px-2 py-0.5 text-xs font-medium text-iupa-medium">
                        {t.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(t)}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(t.id)}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
