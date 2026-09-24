import { useState } from 'react'
import { ChevronDown, ChevronRight, List, Pencil, Trash2, Plus } from 'lucide-react'
import { useAccessCategories } from '../../api/accessCategories'
import {
  useAuthorFields, useCreateAuthorField, useUpdateAuthorField, useDeleteAuthorField,
  useUpdateAuthorFieldOptions, useConsentSettings, useUpdateConsentSettings,
  type AuthorField, type UpsertAuthorField,
} from '../../api/authorMetadata'
import { useUiStore } from '../../store/uiStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const emptyForm: UpsertAuthorField = {
  internalName: '', label: '', fieldType: 'Text', obligatoriness: 'Optional',
  isRepeatable: false, isHidden: false, sortOrder: 0, helpText: '', optionsPipe: '',
}

const obligatorinessBadge: Record<string, string> = {
  Mandatory: 'bg-red-50 text-red-600',
  ConditionallyMandatory: 'bg-orange-50 text-orange-600',
  Recommended: 'bg-amber-50 text-amber-700',
  Optional: 'bg-iupa-light text-iupa-medium',
  NotApplicable: 'bg-gray-50 text-gray-400',
}

const obligatorinessLabels: Record<string, string> = {
  Mandatory: 'Obligatorio', ConditionallyMandatory: 'Condicional', Recommended: 'Recomendado',
  Optional: 'Opcional', NotApplicable: 'No aplica',
}

function FieldForm({
  initial, onSave, onCancel, saving,
}: {
  initial?: UpsertAuthorField & { id?: string }
  onSave: (data: UpsertAuthorField) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<UpsertAuthorField>(initial ?? emptyForm)
  const editing = !!initial?.id

  return (
    <div className={`rounded-lg border p-4 ${editing ? 'border-blue-200 bg-blue-50/30' : 'border-iupa-green/40 bg-iupa-green-light/20'}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-iupa-dark">Label (visible)</label>
          <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="ORCID" className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-iupa-dark">Nombre interno (ej: orcid, afiliacion)</label>
          <input type="text" value={form.internalName} onChange={(e) => setForm({ ...form, internalName: e.target.value })}
            placeholder="orcid" className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm font-mono focus:border-iupa-green focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-iupa-dark">Tipo</label>
          <select value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value as UpsertAuthorField['fieldType'] })}
            className="w-full rounded-lg border border-iupa-light bg-white px-3 py-2 text-sm focus:border-iupa-green focus:outline-none">
            <option value="Text">Text</option>
            <option value="Textarea">Textarea</option>
            <option value="Date">Date</option>
            <option value="Select">Select</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-iupa-dark">Obligatoriedad</label>
          <select value={form.obligatoriness} onChange={(e) => setForm({ ...form, obligatoriness: e.target.value as UpsertAuthorField['obligatoriness'] })}
            className="w-full rounded-lg border border-iupa-light bg-white px-3 py-2 text-sm focus:border-iupa-green focus:outline-none">
            <option value="Mandatory">Obligatorio</option>
            <option value="ConditionallyMandatory">Condicional</option>
            <option value="Recommended">Recomendado</option>
            <option value="Optional">Opcional</option>
          </select>
        </div>
        {form.fieldType === 'Select' && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-iupa-dark">Opciones (separadas por | )</label>
            <input type="text" value={form.optionsPipe} onChange={(e) => setForm({ ...form, optionsPipe: e.target.value })}
              placeholder="Universidad Nacional del Comahue | Universidad de Buenos Aires | Otra"
              className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" />
            {form.optionsPipe && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.optionsPipe.split('|').map((o, i) => o.trim() && (
                  <span key={i} className="rounded-full bg-white px-2 py-0.5 text-xs text-iupa-dark ring-1 ring-iupa-light">{o.trim()}</span>
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-iupa-dark">Orden</label>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-iupa-dark">Texto de ayuda</label>
          <input type="text" value={form.helpText ?? ''} onChange={(e) => setForm({ ...form, helpText: e.target.value })}
            className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" />
        </div>
        <div className="flex items-center gap-6 sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-iupa-dark">
            <input type="checkbox" checked={form.isRepeatable} onChange={(e) => setForm({ ...form, isRepeatable: e.target.checked })}
              className="h-4 w-4 rounded border-iupa-light text-iupa-green" />
            Repetible
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-iupa-dark">
            <input type="checkbox" checked={form.isHidden} onChange={(e) => setForm({ ...form, isHidden: e.target.checked })}
              className="h-4 w-4 rounded border-iupa-light text-iupa-green" />
            Oculto en formularios
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-iupa-light pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={() => onSave(form)} loading={saving}
          disabled={!form.label.trim() || !form.internalName.trim() || (form.fieldType === 'Select' && !(form.optionsPipe ?? '').trim())}>
          {editing ? 'Guardar' : 'Agregar campo'}
        </Button>
      </div>
    </div>
  )
}

function OptionsEditor({ field, onClose }: { field: AuthorField; onClose: () => void }) {
  const saveOptions = useUpdateAuthorFieldOptions()
  const addToast = useUiStore((s) => s.addToast)
  const [pipe, setPipe] = useState(field.options.map((o) => o.label || o.value).join(' | '))

  const handleSave = async () => {
    try {
      const options = pipe.split('|').map((v, i) => ({ value: v.trim(), label: v.trim(), isDefault: false, sortOrder: i })).filter((o) => o.value)
      await saveOptions.mutateAsync({ id: field.id, options })
      addToast('success', 'Opciones actualizadas')
      onClose()
    } catch {
      addToast('error', 'Error al actualizar opciones')
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
      <p className="mb-2 text-xs font-semibold text-amber-700">Opciones de "{field.label}" (separadas por | )</p>
      <input type="text" value={pipe} onChange={(e) => setPipe(e.target.value)} className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saveOptions.isPending}>Guardar opciones</Button>
      </div>
    </div>
  )
}

export default function AuthorMetadataAdmin() {
  const { data: categories } = useAccessCategories()
  const { data: fields, isLoading } = useAuthorFields()
  const createMutation = useCreateAuthorField()
  const updateMutation = useUpdateAuthorField()
  const deleteMutation = useDeleteAuthorField()
  const { data: consent } = useConsentSettings()
  const updateConsentMutation = useUpdateConsentSettings()
  const addToast = useUiStore((s) => s.addToast)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<AuthorField | null>(null)
  const [optionsField, setOptionsField] = useState<AuthorField | null>(null)
  const [consentText, setConsentText] = useState<string | null>(null)
  const [savingConsent, setSavingConsent] = useState(false)

  const consentValue = consentText ?? consent?.consentText ?? ''

  const handleDelete = async (f: AuthorField) => {
    if (!confirm(`¿Eliminar el campo "${f.label}"?`)) return
    try {
      await deleteMutation.mutateAsync(f.id)
      addToast('success', 'Campo eliminado')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleSaveConsent = async () => {
    setSavingConsent(true)
    try {
      await updateConsentMutation.mutateAsync(consentValue)
      addToast('success', 'Texto de consentimiento actualizado')
      setConsentText(null)
    } catch {
      addToast('error', 'Error al guardar el texto')
    } finally {
      setSavingConsent(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-6"><Spinner size="lg" /></div>
  }

  const fieldsByCategory = (fields ?? []).reduce<Record<string, AuthorField[]>>((acc, f) => {
    const key = f.accessCategoryId ?? 'none'
    ;(acc[key] ??= []).push(f)
    return acc
  }, {})

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
          <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5a2.25 2.25 0 002.25 2.25h11.25a2.25 2.25 0 002.25-2.25V16.5a1.5 1.5 0 00-1.5-1.5H18a2.25 2.25 0 00-2.25-2.25H13.5A2.25 2.25 0 0011.25 15H9a1.5 1.5 0 00-1.5 1.5v3a2.25 2.25 0 01-2.25 2.25z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-iupa-dark">Metadatos de autores</h1>
          <p className="text-xs text-iupa-medium">Campos del perfil de autor que completan los usuarios según su categoría de acceso</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-iupa-light bg-iupa-green-light/30 px-6 py-3">
          <span className="text-sm font-semibold text-iupa-green">Texto de consentimiento (formulario de solicitar acceso)</span>
        </div>
        <div className="space-y-3 p-6">
          <textarea
            value={consentValue}
            onChange={(e) => setConsentText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-iupa-light px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSaveConsent} loading={savingConsent}>Guardar texto</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {(categories ?? []).map((cat) => {
          const fields = fieldsByCategory[cat.id] ?? []
          const open = expanded === cat.id
          return (
            <Card key={cat.id} className="overflow-hidden !p-0">
              <button
                onClick={() => setExpanded(open ? null : cat.id)}
                className="flex w-full items-center justify-between border-l-4 border-iupa-green px-5 py-4 text-left hover:bg-iupa-green-light/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {open ? <ChevronDown className="h-4 w-4 text-iupa-medium" /> : <ChevronRight className="h-4 w-4 text-iupa-medium" />}
                  <span className="text-sm font-semibold text-iupa-dark">{cat.name}</span>
                  <span className="rounded-full bg-iupa-green-light px-2.5 py-0.5 text-xs font-medium text-iupa-green">
                    {fields.length} {fields.length === 1 ? 'campo' : 'campos'}
                  </span>
                </div>
                {!open && (
                  <Plus className="h-4 w-4 text-iupa-medium" />
                )}
              </button>

              {open && (
                <div className="border-t border-iupa-light p-4">
                  <div className="mb-3 grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-iupa-medium">
                    <span>Label · nombre interno · ayuda</span>
                    <span>Tipo / obligatoriedad</span>
                    <span className="text-right">Acciones</span>
                  </div>
                  <div className="space-y-2">
                    {fields.length === 0 && (
                      <p className="px-2 py-4 text-center text-xs text-iupa-medium">Esta categoría todavía no tiene campos. Agregá el primero abajo.</p>
                    )}
                    {fields.map((f) =>
                      editingField?.id === f.id ? (
                        <FieldForm
                          key={f.id}
                          initial={{
                            id: f.id, internalName: f.internalName, label: f.label,
                            fieldType: f.fieldType, obligatoriness: f.obligatoriness,
                            isRepeatable: f.isRepeatable, isHidden: f.isHidden,
                            sortOrder: f.sortOrder, helpText: f.helpText ?? '',
                          }}
                          saving={updateMutation.isPending}
                          onSave={async (data) => {
                            try {
                              await updateMutation.mutateAsync({
                                id: f.id, internalName: data.internalName, label: data.label,
                                fieldType: data.fieldType, obligatoriness: data.obligatoriness,
                                isRepeatable: data.isRepeatable, isHidden: data.isHidden,
                                sortOrder: data.sortOrder, helpText: data.helpText,
                                isRequired: data.obligatoriness === 'Mandatory',
                              })
                              addToast('success', 'Campo actualizado')
                              setEditingField(null)
                            } catch {
                              addToast('error', 'Error al actualizar el campo')
                            }
                          }}
                          onCancel={() => setEditingField(null)}
                        />
                      ) : (
                        <div key={f.id} className="flex items-center justify-between rounded-lg border border-iupa-light px-4 py-3 hover:bg-iupa-green-light/20">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-iupa-dark">{f.label}</span>
                              <span className="rounded bg-iupa-light px-1.5 py-0.5 font-mono text-[10px] text-iupa-medium">{f.internalName}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${obligatorinessBadge[f.obligatoriness] ?? 'bg-iupa-light text-iupa-medium'}`}>
                                {obligatorinessLabels[f.obligatoriness] ?? f.obligatoriness}
                              </span>
                              {f.isHidden && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">oculto</span>}
                            </div>
                            {f.helpText && <p className="mt-0.5 truncate text-xs text-iupa-medium">{f.helpText}</p>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-iupa-medium">
                            <span>{f.fieldType}</span>
                            {f.fieldType === 'Select' && f.options.length > 0 && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{f.options.length} opciones</span>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            {f.fieldType === 'Select' && (
                              <button onClick={() => setOptionsField(f)} title="Editar opciones"
                                className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50">
                                <List className="h-4 w-4" />
                              </button>
                            )}
                            <button onClick={() => { setEditingField(f); setAddingFor(null) }} title="Editar"
                              className="rounded-lg p-1.5 text-iupa-green-secondary hover:bg-iupa-green-light">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(f)} title="Eliminar"
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                    {optionsField && optionsField.accessCategoryId === cat.id && (
                      <OptionsEditor field={optionsField} onClose={() => setOptionsField(null)} />
                    )}
                  </div>

                  <div className="mt-4">
                    {addingFor === cat.id ? (
                      <FieldForm
                        saving={createMutation.isPending}
                        onCancel={() => setAddingFor(null)}
                        onSave={async (data) => {
                          try {
                            await createMutation.mutateAsync({ categoryId: cat.id, ...data })
                            addToast('success', 'Campo creado')
                            setAddingFor(null)
                          } catch (err) {
                            addToast('error', err instanceof Error ? err.message : 'Error al crear el campo')
                          }
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => { setAddingFor(cat.id); setEditingField(null) }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-iupa-green/50 py-3 text-sm font-medium text-iupa-green hover:bg-iupa-green-light/20"
                      >
                        <Plus className="h-4 w-4" /> Agregar campo a {cat.name}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
