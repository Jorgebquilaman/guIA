import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Plus, X, HelpCircle, AlertCircle, Check } from 'lucide-react'
import { useMetadataSchemaByType, useDocumentMetadata, useSaveDocumentMetadata } from '../../api/metadata'
import type { MetadataField } from '../../types'

interface DynamicMetadataFormProps {
  documentType: string
  documentId: string
  onSaved?: () => void
  aiMetadataValues?: Record<string, string>
  aiVersion?: number
  onLog?: (msg: string) => void
}

export interface DynamicMetadataFormHandle {
  save: () => Promise<void>
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const DynamicMetadataForm = forwardRef<DynamicMetadataFormHandle, DynamicMetadataFormProps>(function DynamicMetadataForm({ documentType, documentId, onSaved, aiMetadataValues, aiVersion, onLog }, ref) {
  const { data: schema, isLoading: schemaLoading } = useMetadataSchemaByType(documentType)
  const { data: existingValues, isLoading: valuesLoading } = useDocumentMetadata(documentId)
  const saveMutation = useSaveDocumentMetadata(documentId)

  const [values, setValues] = useState<Record<string, string[]>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!schema || !existingValues) return

    const initial: Record<string, string[]> = {}
    for (const field of schema.fields) {
      if (field.isHidden) continue

      const fieldValues = existingValues
        .filter((v) => v.metadataFieldId === field.id)
        .sort((a, b) => a.repeatIndex - b.repeatIndex)
        .map((v) => v.value)

      if (fieldValues.length > 0) {
        initial[field.id] = fieldValues
      } else if (field.fieldType === 'Select' && field.options.length === 1 && field.options[0].isDefault) {
        initial[field.id] = [field.options[0].value]
      } else if (field.isReadOnly || field.obligatoriness === 'NotApplicable') {
        initial[field.id] = ['']
      } else {
        initial[field.id] = ['']
      }
    }

    // Merge AI-suggested values (keyed by field label → field id)
    if (aiMetadataValues && Object.keys(aiMetadataValues).length > 0) {
      onLog?.('Aplicando sugerencias de IA a campos SNRD...')
      let matchedCount = 0
      const totalFields = schema.fields.filter((f) => !f.isHidden && !f.isReadOnly && f.obligatoriness !== 'NotApplicable').length

      // Build a reverse map: AI key -> value
      const aiEntries = Object.entries(aiMetadataValues).filter(([, v]) => v?.trim())

      // Normalize AI keys: strip accents, lowercase
      const normalizedAiMap = new Map<string, string>()
      for (const [k, v] of aiEntries) {
        normalizedAiMap.set(k, v)
        normalizedAiMap.set(k.toLowerCase(), v)
        normalizedAiMap.set(stripAccents(k), v)
        normalizedAiMap.set(stripAccents(k).toLowerCase(), v)
      }

      for (const field of schema.fields) {
        if (field.isHidden || field.isReadOnly || field.obligatoriness === 'NotApplicable') continue

        const candidates = [
          field.label,
          field.internalName,
          `${field.label} (${field.dublinCoreElement})`,
          `${field.label} (${field.dublinCoreElement}.${field.qualifier})`,
          `${field.label} (${field.internalName})`,
          field.dublinCoreElement,
          field.label.toLowerCase(),
          field.internalName.toLowerCase(),
          stripAccents(field.label),
          stripAccents(field.label).toLowerCase(),
          stripAccents(field.internalName),
          stripAccents(field.internalName).toLowerCase(),
        ]

        let matchedValue: string | undefined
        for (const key of candidates) {
          if (normalizedAiMap.has(key)) {
            matchedValue = normalizedAiMap.get(key)
            break
          }
          if (aiMetadataValues[key] && aiMetadataValues[key].trim()) {
            matchedValue = aiMetadataValues[key]
            break
          }
        }

        // Fuzzy match: try case-insensitive partial match (with and without accents)
        if (!matchedValue) {
          for (const [aiKey, aiVal] of aiEntries) {
            const aiNorm = stripAccents(aiKey).toLowerCase()
            const fieldNorm = stripAccents(field.label).toLowerCase()
            const internalNorm = stripAccents(field.internalName).toLowerCase()
            if (aiNorm.includes(fieldNorm) || fieldNorm.includes(aiNorm) || aiNorm.includes(internalNorm) || internalNorm.includes(aiNorm)) {
              matchedValue = aiVal
              break
            }
          }
        }

        // For Select fields, try to match the value against available options
        if (!matchedValue && field.fieldType === 'Select' && field.options.length > 0) {
          for (const [, aiVal] of aiEntries) {
            const valLower = aiVal.toLowerCase().trim()
            const matchedOption = field.options.find(
              (o) => o.value.toLowerCase() === valLower || stripAccents(o.value).toLowerCase() === stripAccents(valLower)
            )
            if (matchedOption) {
              matchedValue = matchedOption.value
              break
            }
          }
        }

        if (matchedValue && !initial[field.id]?.some((v) => v.trim())) {
          // Skip placeholder values that indicate undetected fields
          const trimmed = matchedValue.trim()
          const placeholders = ['(no detectado)', 'no detectado', 'n/a', 'null', 'none', '', '(no disponible)']
          if (placeholders.includes(trimmed.toLowerCase())) continue

          // For Date fields, validate yyyy-MM-dd format
          if (field.fieldType === 'Date') {
            const isoDate = /^\d{4}-\d{2}-\d{2}$/
            if (!isoDate.test(trimmed)) continue
          }

          // For Select fields, ensure value matches an option
          if (field.fieldType === 'Select' && field.options.length > 0) {
            const valid = field.options.some(
              (o) => o.value.toLowerCase() === trimmed.toLowerCase() || stripAccents(o.value).toLowerCase() === stripAccents(trimmed.toLowerCase())
            )
            if (!valid) continue
          }

          // For MultiText fields with multiple values separated by ;
          if (field.fieldType === 'MultiText' || field.isRepeatable) {
            const parts = matchedValue.split(';').map((p: string) => p.trim()).filter(Boolean)
            if (parts.length > 1) {
              initial[field.id] = parts
            } else {
              initial[field.id] = [matchedValue]
            }
          } else {
            initial[field.id] = [matchedValue]
          }
          matchedCount++
        }
      }
      onLog?.(`✓ ${matchedCount}/${totalFields} campos SNRD completados con IA`)
    }

    setValues(initial)
  }, [schema, existingValues, aiMetadataValues, aiVersion])

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }), [handleSave])

  const setFieldValue = useCallback((fieldId: string, index: number, value: string) => {
    setValues((prev) => {
      const arr = [...(prev[fieldId] || [''])];
      arr[index] = value
      return { ...prev, [fieldId]: arr }
    })
    setSaved(false)
  }, [])

  const addRepeatable = useCallback((fieldId: string) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || ['']), ''],
    }))
    setSaved(false)
  }, [])

  const removeRepeatable = useCallback((fieldId: string, index: number) => {
    setValues((prev) => {
      const arr = (prev[fieldId] || ['']).filter((_, i) => i !== index)
      if (arr.length === 0) arr.push('')
      return { ...prev, [fieldId]: arr }
    })
    setSaved(false)
  }, [])

  async function handleSave() {
    if (!schema) return
    try {
      const payload: { fieldId: string; value: string; repeatIndex: number }[] = []
      for (const field of schema.fields) {
        if (field.isHidden || field.isReadOnly || field.obligatoriness === 'NotApplicable') continue
        const fieldValues = values[field.id] || []
        fieldValues.forEach((val, index) => {
          if (val.trim()) {
            payload.push({ fieldId: field.id, value: val.trim(), repeatIndex: index })
          }
        })
      }
      await saveMutation.mutateAsync(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved?.()
    } catch {
      // handled by query client
    }
  }

  function renderField(field: MetadataField) {
    const fieldValues = values[field.id] || ['']
    const isSelect = field.fieldType === 'Select'
    const isMultiText = field.fieldType === 'MultiText'
    const isTextarea = field.fieldType === 'Textarea'
    const isDate = field.fieldType === 'Date'
    const isReadOnly = field.isReadOnly || field.obligatoriness === 'NotApplicable'

    // Single default option → auto-select, show as text
    if (isSelect && field.options.length === 1 && field.options[0].isDefault) {
      return (
        <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
          {field.options[0].label}
        </div>
      )
    }

    const showRepeatButton = field.isRepeatable && field.fieldType !== 'MultiText'

    return (
      <div className="space-y-1.5">
        {fieldValues.map((val, index) => (
          <div key={index} className="flex items-start gap-2">
            {isMultiText || showRepeatButton ? (
              <div className="flex-1">
                {isMultiText ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setFieldValue(field.id, index, e.target.value)}
                      readOnly={isReadOnly}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    {fieldValues.length > 1 && (
                      <button onClick={() => removeRepeatable(field.id, index)} className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setFieldValue(field.id, index, e.target.value)}
                    readOnly={isReadOnly}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                )}
              </div>
            ) : isDate ? (
              <div className="flex-1">
                {isReadOnly ? (
                  <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    Se completa automáticamente
                  </div>
                ) : (
                  <input
                    type="date"
                    value={val}
                    onChange={(e) => setFieldValue(field.id, index, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20"
                  />
                )}
              </div>
            ) : isSelect ? (
              <div className="flex-1">
                <select
                  value={val}
                  onChange={(e) => setFieldValue(field.id, index, e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {!field.isRequired && <option value="">Seleccionar...</option>}
                  {field.options.map((opt) => (
                    <option key={opt.id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : isTextarea ? (
              <div className="flex-1">
                {isReadOnly ? (
                  <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    {val || '—'}
                  </div>
                ) : (
                  <textarea
                    value={val}
                    onChange={(e) => setFieldValue(field.id, index, e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20 resize-y"
                  />
                )}
              </div>
            ) : (
              <div className="flex-1">
                {isReadOnly ? (
                  <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    {val || '—'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setFieldValue(field.id, index, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20"
                  />
                )}
              </div>
            )}

            {showRepeatButton && index === fieldValues.length - 1 && (
              <button
                onClick={() => addRepeatable(field.id)}
                className="shrink-0 rounded-lg border border-dashed border-iupa-green px-2.5 py-2 text-xs font-medium text-iupa-green transition-colors hover:bg-iupa-green hover:text-white"
                title="Agregar otro"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            {isMultiText && fieldValues.length > 1 && index === fieldValues.length - 1 && (
              <button
                onClick={() => addRepeatable(field.id)}
                className="shrink-0 rounded-lg border border-dashed border-iupa-green px-2.5 py-2 text-xs font-medium text-iupa-green transition-colors hover:bg-iupa-green hover:text-white"
                title="Agregar otro"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (schemaLoading || valuesLoading) {
    return <div className="py-8 text-center text-sm text-gray-400">Cargando formulario de metadatos...</div>
  }

  if (!schema) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        No hay un esquema de metadatos configurado para este tipo de documento.
      </div>
    )
  }

  const visibleFields = schema.fields.filter((f) => !f.isHidden)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h3 className="text-sm font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Metadatos SNRD — {schema.label}
          </h3>
          <p className="text-xs text-gray-400">Campos basados en el perfil Dublin Core SNRD</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Guardado
          </span>
        )}
      </div>

      <div className="space-y-4">
        {visibleFields.map((field) => (
          <div key={field.id}>
            <div className="mb-1 flex items-start gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
                {field.obligatoriness === 'Mandatory' && <span className="ml-0.5 text-red-500">*</span>}
                {field.obligatoriness === 'ConditionallyMandatory' && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600" title="Obligatorio si es aplicable">
                    <AlertCircle className="h-2.5 w-2.5" />
                    si aplica
                  </span>
                )}
                {field.obligatoriness === 'Recommended' && (
                  <span className="ml-1.5 text-[10px] text-gray-400">Recomendado</span>
                )}
              </label>
              {field.helpText && (
                <span className="group relative shrink-0" title={field.helpText}>
                  <HelpCircle className="h-3.5 w-3.5 text-gray-300" />
                </span>
              )}
            </div>
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <span className="text-red-500">*</span> Obligatorio
        <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
          <AlertCircle className="h-2.5 w-2.5" />
          si aplica
        </span>
      </div>
    </div>
  )
})

export default DynamicMetadataForm
