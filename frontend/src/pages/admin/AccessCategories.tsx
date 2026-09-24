import { useState } from 'react'
import { useAccessCategories, useCreateAccessCategory, useUpdateAccessCategory, useDeleteAccessCategory } from '../../api/accessCategories'
import { useUiStore } from '../../store/uiStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

interface FormState {
  id?: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
}

const emptyForm: FormState = { name: '', description: '', sortOrder: 0, isActive: true }

export default function AccessCategories() {
  const { data: categories, isLoading } = useAccessCategories()
  const createMutation = useCreateAccessCategory()
  const updateMutation = useUpdateAccessCategory()
  const deleteMutation = useDeleteAccessCategory()
  const addToast = useUiStore((s) => s.addToast)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      if (editing && form.id) {
        await updateMutation.mutateAsync({ id: form.id, name: form.name.trim(), description: form.description.trim(), sortOrder: form.sortOrder, isActive: form.isActive })
        addToast('success', 'Categoría actualizada')
      } else {
        await createMutation.mutateAsync({ name: form.name.trim(), description: form.description.trim(), sortOrder: form.sortOrder, isActive: form.isActive })
        addToast('success', 'Categoría creada')
      }
      setForm(emptyForm)
      setEditing(false)
    } catch {
      addToast('error', 'Error al guardar la categoría')
    }
  }

  const handleEdit = (c: NonNullable<typeof categories>[number]) => {
    setForm({ id: c.id, name: c.name, description: c.description, sortOrder: c.sortOrder, isActive: c.isActive })
    setEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"? Los usuarios que la tengan asignada la conservan como referencia.`)) return
    try {
      await deleteMutation.mutateAsync(id)
      addToast('success', 'Categoría eliminada')
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-iupa-dark">Categorías de acceso</h1>
          <p className="text-xs text-iupa-medium">Definen los perfiles que eligen los usuarios al solicitar acceso (estudiante, docente, investigador...)</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-iupa-light bg-iupa-green-light/30 px-6 py-3">
          <span className="text-sm font-semibold text-iupa-green">{editing ? 'Editar categoría' : 'Nueva categoría'}</span>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-iupa-dark">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Estudiante"
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-iupa-dark">Orden</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-iupa-dark">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
                />
                Visible en el formulario de acceso
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Descripción <span className="font-normal text-iupa-medium">(orienta al usuario a elegir la categoría correcta)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Si sos estudiante del IUPA y necesitás buscar y descargar material para tus estudios..."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            />
            <p className="mt-1 text-right text-xs text-iupa-medium">{form.description.length}/500</p>
          </div>
          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            {editing && (
              <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editing ? 'Actualizar' : 'Agregar categoría'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-iupa-dark">Categorías existentes</h2>
          <span className="rounded-full bg-iupa-green-light px-2.5 py-0.5 text-xs font-medium text-iupa-green">
            {categories?.length ?? 0}
          </span>
        </div>

        {(categories?.length ?? 0) === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-medium text-iupa-dark">No hay categorías configuradas</p>
              <p className="mt-1 text-xs text-iupa-medium">Creá la primera con el formulario de arriba</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {categories?.map((c) => (
              <Card key={c.id} className="overflow-hidden !p-0">
                <div className="flex items-center justify-between border-l-4 border-iupa-green px-5 py-4 transition-all duration-150 hover:bg-iupa-green-light/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-iupa-green text-sm font-bold text-white shadow-sm">
                      {c.sortOrder}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-iupa-dark">{c.name}</span>
                        {c.isActive ? (
                          <Badge variant="approved">Visible</Badge>
                        ) : (
                          <Badge variant="archived">Oculta</Badge>
                        )}
                      </div>
                      {c.description && (
                        <p className="mt-0.5 truncate text-xs text-iupa-medium">{c.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(c)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(c.id, c.name)}>Eliminar</Button>
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
