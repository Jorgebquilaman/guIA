import { useState } from 'react'
import { ChevronDown, ChevronRight, Settings, Plus, Trash2, BookMarked } from 'lucide-react'
import { useMetadataSchemas, useCreateMetadataField, useUpdateMetadataField, useDeleteMetadataField, useCreateMetadataSchema } from '../../api/metadata'
import type { MetadataField } from '../../types'
import Button from '../../components/ui/Button'

export default function MetadataSchemasAdmin() {
  const { data: schemas, isLoading } = useMetadataSchemas()
  const createSchemaMutation = useCreateMetadataSchema()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
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
            </button>

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
  const [sortOrder, setSortOrder] = useState(0)
  const [helpText, setHelpText] = useState('')

  async function handleCreate() {
    if (!dublinCoreElement.trim() || !internalName.trim() || !label.trim()) return
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
      sortOrder,
      helpText: helpText.trim() || null,
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
            <option value="Select">Select</option>
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
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onDone}
            className="rounded px-3 py-1 text-xs text-gray-500 hover:bg-gray-100">Cancelar</button>
          <button onClick={handleCreate} disabled={createMutation.isPending || !dublinCoreElement.trim() || !internalName.trim() || !label.trim()}
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
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(field.label)
  const [helpText, setHelpText] = useState(field.helpText ?? '')
  const [obligatoriness, setObligatoriness] = useState(field.obligatoriness)
  const [isHidden, setIsHidden] = useState(field.isHidden)
  const [sortOrder, setSortOrder] = useState(field.sortOrder)

  async function handleSave() {
    await updateMutation.mutateAsync({
      fieldId: field.id,
      label,
      isRequired: obligatoriness === 'Mandatory',
      obligatoriness,
      sortOrder,
      isHidden,
      helpText: helpText || null,
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
            <label className="text-[11px] font-medium text-gray-500">Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500">Help text</label>
            <input type="text" value={helpText} onChange={(e) => setHelpText(e.target.value)}
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
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} className="rounded" />
              Oculto
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setEditing(false)}
              className="rounded px-3 py-1 text-xs text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleSave}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Guardar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50">
      <span className="w-8 text-gray-300">{index + 1}</span>
      <span className="w-32 font-mono text-gray-500">{field.dublinCoreElement}</span>
      <div className="flex-1">
        <span className="text-gray-800">{field.label}</span>
        {field.qualifier && <span className="ml-1 text-gray-400">— {field.qualifier}</span>}
        {field.isHidden && <span className="ml-1.5 rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-400">oculto</span>}
      </div>
      <span className="w-20 text-gray-400">{field.fieldType}</span>
      <span className="w-20">{obligatorinessBadge(field.obligatoriness)}</span>
      <span className="w-24 text-gray-400">{field.options.length > 0 ? `${field.options.length} opciones` : '—'}</span>
      <div className="flex w-10 items-center gap-0.5">
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
  )
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
