import { useState } from 'react'
import { ChevronDown, ChevronRight, Settings, Plus, Trash2, BookMarked, Copy, List } from 'lucide-react'
import { useMetadataSchemas, useCreateMetadataField, useUpdateMetadataField, useDeleteMetadataField, useCreateMetadataSchema, useDeleteMetadataSchema, useUpdateFieldOptions } from '../../api/metadata'
import type { MetadataField } from '../../types'
import Button from '../../components/ui/Button'

export default function MetadataSchemasAdmin() {
  const { data: schemas, isLoading } = useMetadataSchemas()
  const createSchemaMutation = useCreateMetadataSchema()
  const deleteSchemaMutation = useDeleteMetadataSchema()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [cloneForm, setCloneForm] = useState<{ schemaId: string; documentTypeName: string; label: string } | null>(null)
  const [addingSchemaId, setAddingSchemaId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Cargando esquemas...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Esquemas de Metadatos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Perfil SNRD / Dublin Core — cada tipo de documento tiene su propio conjunto de campos.
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Crear esquema
        </Button>
      </div>

      {showCreateModal && (
        <CreateSchemaModal
          schemas={schemas ?? []}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            await createSchemaMutation.mutateAsync(data)
            setShowCreateModal(false)
          }}
        />
      )}

      <div className="space-y-3">
        {(schemas ?? []).map((schema) => (
          <div key={schema.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
              onClick={() => toggle(schema.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              {expanded[schema.id] ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              )}
              <BookMarked className="h-5 w-5 shrink-0 text-iupa-green" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-iupa-dark">{schema.label}</span>
                <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                  {schema.documentTypeName}
                </span>
              </div>
              <span className="text-xs text-gray-400">{schema.fields.length} campos</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCloneForm({ schemaId: schema.id, documentTypeName: schema.documentTypeName + '_copia', label: schema.label + ' (copia)' })
                }}
                className="ml-2 inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-500 hover:bg-blue-50"
                title="Clonar este esquema"
              >
                <Copy className="h-3.5 w-3.5" />
                Clonar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`¿Eliminar el esquema "${schema.label}" y todos sus campos?`))
                    deleteSchemaMutation.mutate({ id: schema.id })
                }}
                disabled={deleteSchemaMutation.isPending}
                className="ml-2 inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                title="Eliminar todo el esquema"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(
                    `ELIMINAR FORZADO del esquema "${schema.label}".\n\nSe borrarán también TODOS los valores de metadatos asociados en los documentos.\n\n¿Continuar?`
                  ))
                    deleteSchemaMutation.mutate({ id: schema.id, force: true })
                }}
                disabled={deleteSchemaMutation.isPending}
                className="ml-2 inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 bg-red-500"
                title="Eliminar el esquema junto con sus valores de metadatos en documentos"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar forzado
              </button>
            </button>

            {cloneForm?.schemaId === schema.id && (
              <div className="border-t border-blue-100 bg-blue-50 px-5 py-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-0.5 block text-[11px] font-medium text-gray-500">DocumentTypeName *</label>
                    <input
                      type="text"
                      value={cloneForm.documentTypeName}
                      onChange={(e) => setCloneForm({ ...cloneForm, documentTypeName: e.target.value })}
                      className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Label *</label>
                    <input
                      type="text"
                      value={cloneForm.label}
                      onChange={(e) => setCloneForm({ ...cloneForm, label: e.target.value })}
                      className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-0.5">
                    <button
                      onClick={() => setCloneForm(null)}
                      className="rounded px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={createSchemaMutation.isPending || !cloneForm.documentTypeName.trim() || !cloneForm.label.trim()}
                      onClick={async () => {
                        await createSchemaMutation.mutateAsync({
                          documentTypeName: cloneForm.documentTypeName.trim(),
                          label: cloneForm.label.trim(),
                          isActive: true,
                          sortOrder: 0,
                          cloneFromSchemaId: cloneForm.schemaId,
                        })
                        setCloneForm(null)
                      }}
                      className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createSchemaMutation.isPending ? 'Clonando...' : 'Clonar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {expanded[schema.id] && (
              <div className="border-t border-gray-100 px-5 pb-4 pt-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <span className="w-8" />
                  <span className="w-32">DC Element</span>
                  <span className="flex-1">Label</span>
                  <span className="w-20">Type</span>
                  <span className="w-20">Oblig.</span>
                  <span className="w-24">Opciones</span>
                  <span className="w-10" />
                </div>

                {schema.fields.map((field, idx) => (
                  <FieldRow key={field.id} field={field} index={idx} />
                ))}

                {addingSchemaId === schema.id && (
                  <AddFieldForm
                    schemaId={schema.id}
                    onDone={() => setAddingSchemaId(null)}
                  />
                )}

                <button
                  onClick={() => setAddingSchemaId(addingSchemaId === schema.id ? null : schema.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-iupa-green hover:text-iupa-green/80"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar campo personalizado
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CreateSchemaModal({
  schemas,
  onClose,
  onCreate,
}: {
  schemas: { id: string; label: string; documentTypeName: string; fields: unknown[] }[]
  onClose: () => void
  onCreate: (data: { documentTypeName: string; label: string; isActive: boolean; sortOrder: number; cloneFromSchemaId?: string | null }) => Promise<void>
}) {
  const [documentTypeName, setDocumentTypeName] = useState('')
  const [label, setLabel] = useState('')
  const [cloneFromSchemaId, setCloneFromSchemaId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!documentTypeName.trim() || !label.trim()) return
    setCreating(true)
    try {
      await onCreate({
        documentTypeName: documentTypeName.trim(),
        label: label.trim(),
        isActive: true,
        sortOrder: 0,
        cloneFromSchemaId,
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-iupa-dark">Crear esquema de metadatos</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">DocumentTypeName *</label>
            <input
              type="text" value={documentTypeName} onChange={(e) => setDocumentTypeName(e.target.value)}
              placeholder="ej: Article"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Label *</label>
            <input
              type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="ej: Artículo SNRD"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Clonar campos desde</label>
            <select
              value={cloneFromSchemaId ?? ''}
              onChange={(e) => setCloneFromSchemaId(e.target.value || null)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green"
            >
              <option value="">— No clonar —</option>
              {schemas.filter((s) => s.fields.length > 0).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.documentTypeName}) — {s.fields.length} campos
                </option>
              ))}
            </select>
            {cloneFromSchemaId && (
              <p className="mt-1 text-xs text-gray-400">Se copiarán todos los campos y opciones del esquema seleccionado.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !documentTypeName.trim() || !label.trim()}
            className="rounded-lg bg-iupa-green px-4 py-2 text-sm font-medium text-white hover:bg-iupa-green/90 disabled:opacity-50"
          >
            {creating ? 'Creando...' : 'Crear esquema'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddFieldForm({ schemaId, onDone }: { schemaId: string; onDone: () => void }) {
  const createMutation = useCreateMetadataField(schemaId)
  const [dublinCoreElement, setDublinCoreElement] = useState('')
  const [qualifier, setQualifier] = useState('')
  const [internalName, setInternalName] = useState('')
  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState('Text')
  const [obligatoriness, setObligatoriness] = useState('Optional')
  const [isRepeatable, setIsRepeatable] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isSimpleView, setIsSimpleView] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [helpText, setHelpText] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [optionsPipe, setOptionsPipe] = useState('')

  const parsedOptions = optionsPipe
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean)

  async function handleCreate() {
    if (!dublinCoreElement.trim() || !internalName.trim() || !label.trim()) return
    if (fieldType === 'Select' && parsedOptions.length === 0) return
    await createMutation.mutateAsync({
      dublinCoreElement: dublinCoreElement.trim(),
      qualifier: qualifier.trim() || null,
      internalName: internalName.trim(),
      label: label.trim(),
      fieldType,
      obligatoriness,
      isRepeatable,
      isReadOnly,
      isHidden,
      isSimpleView,
      sortOrder,
      helpText: helpText.trim() || null,
      aiPrompt: aiPrompt.trim() || null,
      optionsPipe: fieldType === 'Select' ? parsedOptions.join('|') : null,
    } as unknown as Partial<MetadataField>)
    onDone()
  }

  return (
    <div className="mb-2 rounded-lg border border-green-100 bg-green-50 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-gray-500">DC Element *</label>
          <input type="text" value={dublinCoreElement} onChange={(e) => setDublinCoreElement(e.target.value)}
            placeholder="ej: dc.title"
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500">Qualifier</label>
          <input type="text" value={qualifier} onChange={(e) => setQualifier(e.target.value)}
            placeholder="ej: alternative"
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500">InternalName *</label>
          <input type="text" value={internalName} onChange={(e) => setInternalName(e.target.value)}
            placeholder="ej: title_alternative"
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500">Label *</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="ej: Título alternativo"
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500">Field type</label>
          <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400">
            <option value="Text">Text</option>
            <option value="Textarea">Textarea</option>
            <option value="Date">Date</option>
            <option value="Select">Combo (lista de valores)</option>
            <option value="MultiText">MultiText</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500">Obligatoriness</label>
          <select value={obligatoriness} onChange={(e) => setObligatoriness(e.target.value)}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400">
            <option value="Mandatory">Mandatory</option>
            <option value="ConditionallyMandatory">ConditionallyMandatory</option>
            <option value="Recommended">Recommended</option>
            <option value="Optional">Optional</option>
            <option value="NotApplicable">NotApplicable</option>
          </select>
        </div>
        {fieldType === 'Select' && (
          <div className="col-span-2">
            <label className="text-[11px] font-medium text-gray-500">
              Valores posibles (separados por |) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={optionsPipe}
              onChange={(e) => setOptionsPipe(e.target.value)}
              placeholder="ej: Artículo|Tesis|Informe|Ponencia"
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400"
            />
            {parsedOptions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-gray-400">{parsedOptions.length} valor(es):</span>
                {parsedOptions.map((opt) => (
                  <span key={opt} className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    {opt}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <label className="text-[11px] font-medium text-gray-500">Sort order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500">Help text</label>
          <input type="text" value={helpText} onChange={(e) => setHelpText(e.target.value)}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400" />
        </div>
        <div className="col-span-2">
          <label className="text-[11px] font-medium text-gray-500">Prompt IA <span className="font-normal text-gray-400">(instrucción específica para la IA — si se deja vacío se usa Help text)</span></label>
          <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ej: Extrae el título tal como aparece en la portada, sin abreviaturas ni subtítulo..."
            rows={2}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-green-400" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input type="checkbox" checked={isRepeatable} onChange={(e) => setIsRepeatable(e.target.checked)} className="rounded" />
            Repetible
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input type="checkbox" checked={isReadOnly} onChange={(e) => setIsReadOnly(e.target.checked)} className="rounded" />
            Sólo lectura
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} className="rounded" />
            Oculto
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600" title="Marca el campo para la vista sencilla">
            <input type="checkbox" checked={isSimpleView} onChange={(e) => setIsSimpleView(e.target.checked)} className="rounded" />
            Vista Sencilla
          </label>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onDone}
            className="rounded px-3 py-1 text-xs text-gray-500 hover:bg-gray-100">Cancelar</button>
          <button onClick={handleCreate} disabled={createMutation.isPending || !dublinCoreElement.trim() || !internalName.trim() || !label.trim() || (fieldType === 'Select' && parsedOptions.length === 0)}
            className="rounded bg-iupa-green px-3 py-1 text-xs font-medium text-white hover:bg-iupa-green/90 disabled:opacity-50">
            {createMutation.isPending ? 'Creando...' : 'Crear campo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ field, index }: { field: MetadataField; index: number }) {
  const deleteMutation = useDeleteMetadataField()
  const updateMutation = useUpdateMetadataField()
  const updateOptionsMutation = useUpdateFieldOptions(field.id)
  const [editing, setEditing] = useState(false)
  const [editingOptions, setEditingOptions] = useState(false)
  const [optionsPipeText, setOptionsPipeText] = useState('')
  const [dublinCoreElement, setDublinCoreElement] = useState(field.dublinCoreElement)
  const [qualifier, setQualifier] = useState(field.qualifier ?? '')
  const [internalName, setInternalName] = useState(field.internalName)
  const [fieldType, setFieldType] = useState(field.fieldType)
  const [isRepeatable, setIsRepeatable] = useState(field.isRepeatable)
  const [isReadOnly, setIsReadOnly] = useState(field.isReadOnly)
  const [isSimpleView, setIsSimpleView] = useState(field.isSimpleView)
  const [label, setLabel] = useState(field.label)
  const [helpText, setHelpText] = useState(field.helpText ?? '')
  const [aiPrompt, setAiPrompt] = useState(field.aiPrompt ?? '')
  const [obligatoriness, setObligatoriness] = useState(field.obligatoriness)
  const [isHidden, setIsHidden] = useState(field.isHidden)
  const [sortOrder, setSortOrder] = useState(field.sortOrder)

  function openOptionsEditor() {
    setOptionsPipeText(field.options.map((o) => o.value).join('|'))
    setEditingOptions(true)
  }

  async function handleSaveOptions() {
    const values = optionsPipeText
      .split('|')
      .map((v) => v.trim())
      .filter(Boolean)
    await updateOptionsMutation.mutateAsync(values.map((v, i) => ({ value: v, label: v, isDefault: false, sortOrder: i })))
    setEditingOptions(false)
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      fieldId: field.id,
      label,
      isRequired: obligatoriness === 'Mandatory',
      obligatoriness,
      sortOrder,
      isHidden,
      helpText: helpText || null,
      aiPrompt: aiPrompt.trim() || null,
      dublinCoreElement: dublinCoreElement.trim(),
      qualifier: qualifier.trim() || null,
      internalName: internalName.trim(),
      fieldType,
      isRepeatable,
      isReadOnly,
      isSimpleView,
    })
    setEditing(false)
  }

  async function handleDelete() {
    if (window.confirm(`¿Eliminar el campo "${field.label}"?`)) {
      await deleteMutation.mutateAsync(field.id)
    }
  }

  if (editing) {
    return (
      <div className="mb-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-gray-500">DC Element *</label>
            <input type="text" value={dublinCoreElement} onChange={(e) => setDublinCoreElement(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">Qualifier</label>
            <input type="text" value={qualifier} onChange={(e) => setQualifier(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">InternalName *</label>
            <input type="text" value={internalName} onChange={(e) => setInternalName(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">Label *</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">Field type</label>
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value as MetadataField['fieldType'])}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400">
              <option value="Text">Texto</option>
              <option value="Textarea">Área de texto</option>
              <option value="Date">Fecha</option>
              <option value="Select">Combo (lista de valores)</option>
              <option value="MultiText">Multi-texto</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">Help text</label>
            <input type="text" value={helpText} onChange={(e) => setHelpText(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-medium text-gray-500">Prompt IA <span className="font-normal text-gray-400">(vacío = usa Help text)</span></label>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Instrucción específica para la IA para este campo..."
              rows={2}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">Obligatoriness</label>
            <select value={obligatoriness} onChange={(e) => setObligatoriness(e.target.value as typeof obligatoriness)}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400">
              <option value="Mandatory">Mandatory</option>
              <option value="ConditionallyMandatory">ConditionallyMandatory</option>
              <option value="Recommended">Recommended</option>
              <option value="Optional">Optional</option>
              <option value="NotApplicable">NotApplicable</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">Sort order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input type="checkbox" checked={isRepeatable} onChange={(e) => setIsRepeatable(e.target.checked)} className="rounded" />
              Repetible
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input type="checkbox" checked={isReadOnly} onChange={(e) => setIsReadOnly(e.target.checked)} className="rounded" />
              Sólo lectura
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} className="rounded" />
              Oculto
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600" title="Marca el campo para la vista sencilla">
              <input type="checkbox" checked={isSimpleView} onChange={(e) => setIsSimpleView(e.target.checked)} className="rounded" />
              Vista Sencilla
            </label>
          </div>
          <div className="col-span-2 flex items-center justify-end gap-2">
            <button onClick={() => setEditing(false)}
              className="rounded px-3 py-1 text-xs text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleSave}
              disabled={!dublinCoreElement.trim() || !internalName.trim() || !label.trim()}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">Guardar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {editingOptions && (
        <div className="mb-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <label className="text-[11px] font-medium text-gray-500">
            Valores posibles de "{field.label}" (separados por |)
          </label>
          <input
            type="text"
            value={optionsPipeText}
            onChange={(e) => setOptionsPipeText(e.target.value)}
            placeholder="ej: Artículo|Tesis|Informe|Ponencia"
            className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
          />
          {optionsPipeText
            .split('|')
            .map((v) => v.trim())
            .filter(Boolean).length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {optionsPipeText.split('|').map((v) => v.trim()).filter(Boolean).map((opt) => (
                  <span key={opt} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200">
                    {opt}
                  </span>
                ))}
              </div>
            )}
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setEditingOptions(false)}
              className="rounded px-3 py-1 text-xs text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleSaveOptions} disabled={updateOptionsMutation.isPending}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {updateOptionsMutation.isPending ? 'Guardando...' : 'Guardar opciones'}
            </button>
          </div>
        </div>
      )}
      <div className="mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50">
      <span className="w-8 text-gray-300">{index + 1}</span>
      <span className="w-32 font-mono text-gray-500">{field.dublinCoreElement}</span>
      <div className="flex-1">
        <span className="text-gray-800">{field.label}</span>
        {field.qualifier && <span className="ml-1 text-gray-400">— {field.qualifier}</span>}
        {field.isHidden && <span className="ml-1.5 rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-400">oculto</span>}
        {field.isSimpleView && <span className="ml-1.5 rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-500">sencilla</span>}
      </div>
      <span className="w-20 text-gray-400">{fieldTypeLabel(field.fieldType)}</span>
      <span className="w-20">{obligatorinessBadge(field.obligatoriness)}</span>
      <span className="w-24 text-gray-400">{field.options.length > 0 ? `${field.options.length} opciones` : '—'}</span>
      <div className={`flex items-center gap-0.5 ${field.fieldType === 'Select' ? 'w-14' : 'w-10'}`}>
        {field.fieldType === 'Select' && (
          <button onClick={openOptionsEditor}
            className="rounded p-0.5 text-gray-300 hover:text-blue-600"
            title="Editar valores posibles">
            <List className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => setEditing(true)}
          className="rounded p-0.5 text-gray-300 hover:text-blue-600">
          <Settings className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleDelete}
          className="rounded p-0.5 text-gray-300 hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
    </>
  )
}

function fieldTypeLabel(type: string) {
  const labels: Record<string, string> = {
    Text: 'Texto',
    Textarea: 'Área de texto',
    Date: 'Fecha',
    Select: 'Combo',
    MultiText: 'Multi-texto',
  }
  return labels[type] ?? type
}

function obligatorinessBadge(level: string) {
  const colors: Record<string, string> = {
    Mandatory: 'bg-red-50 text-red-600',
    ConditionallyMandatory: 'bg-orange-50 text-orange-600',
    Recommended: 'bg-blue-50 text-blue-600',
    Optional: 'bg-gray-50 text-gray-400',
    NotApplicable: 'bg-gray-50 text-gray-400',
  }
  const labels: Record<string, string> = {
    Mandatory: 'Oblig.',
    ConditionallyMandatory: 'Si aplica',
    Recommended: 'Recom.',
    Optional: 'Opc.',
    NotApplicable: 'Auto',
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[level] || ''}`}>
      {labels[level] || level}
    </span>
  )
}
