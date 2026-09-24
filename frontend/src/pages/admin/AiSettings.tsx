import { useState, useEffect, useMemo } from 'react'
import { useAiSettings, useUpdateAiSettings, useAiUsage } from '../../api/admin'
import { useMetadataSchemas, useUpdateMetadataField } from '../../api/metadata'
import { useUiStore } from '../../store/uiStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'

const DEFAULT_PROMPT = `Eres un asistente experto en metadatos académicos SNRD (Sistema Nacional de Repositorios Digitales). Analiza el texto del documento proporcionado y extraé TODA la información posible en formato JSON. Devuelve SOLO un objeto JSON válido sin formato adicional ni markdown.

Campos obligatorios del JSON:
- summary: resumen breve del documento en español (string)
- description: descripción más extensa del contenido (string)
- keywords: array de palabras clave relevantes en español (array of strings, máx 10)
- keywordsEn: array of keywords in English if present in the text (array of strings, max 10)
- authors: array de nombres de autores en formato AACR2: "Apellido, Nombre". Si hay múltiples autores, cada uno es un elemento del array. NO incluir " y " entre nombres. (array of strings)
- abstractEn: English abstract if present in the text (string, or null)
- publicationVersion: versión de la publicación, ej: "acceptedVersion", "publishedVersion", "updatedVersion" (string, or null)
- digitalIdentifier: identificador digital único, ej: DOI, URI, Handle (string, or null)
- extractedEntities: entidades notables encontradas como personas, instituciones, lugares (string, or null)
- confidence: puntaje de confianza entre 0 y 1 (number)

Reglas AACR2 obligatorias para autores:
- Formato: "Apellido, Nombre" (ej: "García, María")
- Si hay más de un autor, cada uno va como elemento separado del array authors
- NO usar " y " para unir autores, cada autor es un string independiente en el array
Otras reglas de formato:
- Subtítulos separados del título con ' : ' (espacio-dos puntos-espacio)
- Páginas: usar 'p. ' seguido del rango. Ej: 'p. 45-56'
- Fechas: AAAA-MM-DD (ISO 8601)
- Filiación: 'Fil: Apellido, Nombre. Institución mayor. Dependencia; País.'
{fields}
Devuelve SOLO un objeto JSON válido sin formato adicional ni markdown. No incluyas bloques \`\`\`json ni explicaciones.`

export default function AiSettings() {
  const { data: settings, isLoading } = useAiSettings()
  const { data: schemas } = useMetadataSchemas()
  const updateMutation = useUpdateAiSettings()
  const addToast = useUiStore((s) => s.addToast)

  const [apiUrl, setApiUrl] = useState('https://api.deepseek.com/v1/chat/completions')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('deepseek-chat')
  const [maxTokens, setMaxTokens] = useState(4096)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT)
  const [previewSchemaId, setPreviewSchemaId] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setApiUrl(settings.apiUrl)
      setApiKey(settings.apiKey)
      setModel(settings.model)
      setMaxTokens(settings.maxTokens)
      setSystemPrompt(settings.systemPrompt ?? DEFAULT_PROMPT)
    }
  }, [settings])

  const handleSave = async () => {
    if (!apiUrl.trim() || !apiKey.trim() || !model.trim()) return
    if (!systemPrompt.includes('{fields}')) {
      addToast('error', 'El prompt debe contener el placeholder {fields} para los campos de metadatos.')
      return
    }
    try {
      await updateMutation.mutateAsync({ apiUrl: apiUrl.trim(), apiKey: apiKey.trim(), model: model.trim(), maxTokens, systemPrompt })
      addToast('success', 'Configuración de IA guardada')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Error al guardar la configuración'
      addToast('error', msg)
    }
  }

  const provider = apiUrl.includes('deepseek')
    ? { name: 'DeepSeek', color: 'bg-blue-600', label: 'deepseek-chat' }
    : apiUrl.includes('claude') || apiUrl.includes('anthropic')
    ? { name: 'Claude', color: 'bg-orange-600', label: 'Claude (Anthropic)' }
    : apiUrl.includes('openai') || apiUrl.includes('chatgpt')
    ? { name: 'OpenAI', color: 'bg-emerald-600', label: 'GPT / OpenAI' }
    : apiUrl.includes('gemini') || apiUrl.includes('googleapis')
    ? { name: 'Gemini', color: 'bg-purple-600', label: 'Gemini (Google)' }
    : null

  const [showUsage, setShowUsage] = useState(false)
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useAiUsage(showUsage)

  const handleConsultarSaldo = () => {
    if (!showUsage) setShowUsage(true)
    else refetchUsage()
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-iupa-dark">Configuración de IA</h1>
      </div>

      <Card>
        <div className="space-y-5 p-6">
          <div className="rounded-lg border border-iupa-green-light bg-iupa-green-light p-4 text-sm text-iupa-green">
            Configura el proveedor de IA para el catalogado automático de documentos.
            Los cambios se aplican inmediatamente.
          </div>

          {provider && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${provider.color} text-xs font-bold text-white`}>
                {provider.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{provider.name}</p>
                <p className="text-xs text-gray-500">{provider.label} — {apiUrl.includes('deepseek') ? 'deepseek.com' : apiUrl.includes('claude') ? 'anthropic.com' : apiUrl.includes('openai') ? 'openai.com' : ''}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              onClick={handleConsultarSaldo}
              disabled={usageLoading}
              className="flex items-center gap-1.5 rounded-lg border border-iupa-green bg-white px-3 py-1.5 text-xs font-medium text-iupa-green transition hover:bg-iupa-green hover:text-white"
            >
              {usageLoading ? <Spinner size="sm" /> : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Consultar saldo
            </button>
          </div>

          {showUsage && usage && !usageLoading && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-iupa-dark">Saldo y Consumo</h3>
              {usage.error ? (
                <p className="text-xs text-red-500">No se pudo consultar el saldo: {usage.error}</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Saldo total</p>
                    <p className="text-lg font-bold text-iupa-dark">
                      {usage.totalBalance != null ? `${usage.totalBalance.toFixed(2)} ${usage.currency}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Saldo otorgado</p>
                    <p className="text-lg font-bold text-iupa-dark">
                      {usage.grantedBalance != null ? `${usage.grantedBalance.toFixed(2)} ${usage.currency}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tokens estimados</p>
                    <p className="text-lg font-bold text-iupa-dark">
                      {usage.estimatedTokens != null ? `${(usage.estimatedTokens / 1_000_000).toFixed(1)}M` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Disponible</p>
                    <p className={`text-lg font-bold ${usage.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {usage.isAvailable ? 'Sí' : 'No'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {showUsage && usageLoading && (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Consultando saldo...</span>
            </div>
          )}

          <Input
            label="URL de la API"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.deepseek.com/v1/chat/completions"
          />

          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-deep-..."
          />

          <Input
            label="Modelo"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-chat"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-iupa-dark">Máximo de tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
              min={256}
              max={65536}
              className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-iupa-dark">System Prompt (instrucciones para la IA)</label>
              <button
                onClick={() => setSystemPrompt(DEFAULT_PROMPT)}
                className="text-xs text-gray-400 hover:text-iupa-green"
              >
                Restaurar prompt por defecto
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={14}
              className="w-full rounded-lg border border-iupa-light px-3 py-2 font-mono text-xs leading-relaxed focus:border-iupa-green focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              El placeholder <code className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-red-500">{'{fields}'}</code> es obligatorio y se reemplaza con los campos SNRD del tipo de documento.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-iupa-dark">Vista previa — prompt completo con campos SNRD</h3>
              <select
                value={previewSchemaId ?? ''}
                onChange={(e) => setPreviewSchemaId(e.target.value || null)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-iupa-green"
              >
                <option value="">Seleccionar tipo de documento...</option>
                {(schemas ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.label} ({s.documentTypeName})</option>
                ))}
              </select>
            </div>
            {previewSchemaId ? (
              <FullPromptPreview
                template={systemPrompt}
                schemaId={previewSchemaId}
                schemas={schemas ?? []}
              />
            ) : (
              <p className="text-xs text-gray-400">Seleccioná un tipo de documento para ver el prompt completo que se enviará a la IA, con los campos SNRD expandidos.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {settings && (
              <Button variant="ghost" onClick={() => { setApiUrl(settings.apiUrl); setApiKey(settings.apiKey); setModel(settings.model); setMaxTokens(settings.maxTokens); setSystemPrompt(settings.systemPrompt ?? DEFAULT_PROMPT); }}>
                Restaurar
              </Button>
            )}
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              Guardar configuración
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function FullPromptPreview({
  template,
  schemaId,
  schemas,
}: {
  template: string
  schemaId: string
  schemas: {
    id: string
    label: string
    documentTypeName: string
    fields: {
      id: string
      label: string
      internalName: string
      dublinCoreElement: string
      qualifier: string | null
      fieldType: string
      isHidden: boolean
      isReadOnly: boolean
      isSimpleView: boolean
      isRepeatable: boolean
      obligatoriness: string
      sortOrder: number
      helpText: string | null
      aiPrompt: string | null
      options: { value: string; label: string }[]
    }[]
  }[]
}) {
  const schema = schemas.find((s) => s.id === schemaId)
  const updateField = useUpdateMetadataField()
  const addToast = useUiStore((s) => s.addToast)
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({})
  const [savingField, setSavingField] = useState<string | null>(null)

  useEffect(() => {
    if (!schema) {
      setEditedPrompts({})
      return
    }
    const initial: Record<string, string> = {}
    for (const f of schema.fields) {
      if (!f.isHidden && !f.isReadOnly && f.obligatoriness !== 'NotApplicable') {
        initial[f.id] = f.aiPrompt ?? ''
      }
    }
    setEditedPrompts(initial)
  }, [schemaId])

  const handleSaveFieldPrompt = async (field: NonNullable<typeof schema>['fields'][number]) => {
    const newPrompt = (editedPrompts[field.id] ?? '').trim()
    const original = (field.aiPrompt ?? '').trim()
    if (newPrompt === original) return
    setSavingField(field.id)
    try {
      await updateField.mutateAsync({
        fieldId: field.id,
        label: field.label,
        isRequired: field.obligatoriness === 'Mandatory',
        obligatoriness: field.obligatoriness,
        sortOrder: field.sortOrder,
        isHidden: field.isHidden,
        helpText: field.helpText,
        aiPrompt: newPrompt || null,
      })
      addToast('success', `Prompt de "${field.label}" guardado`)
    } catch {
      addToast('error', `Error al guardar el prompt de "${field.label}"`)
    } finally {
      setSavingField(null)
    }
  }

  const expanded = useMemo(() => {
    if (!schema) return template

    const visibleFields = schema.fields.filter(
      (f) => !f.isHidden && !f.isReadOnly && f.obligatoriness !== 'NotApplicable'
    )

    if (visibleFields.length === 0) {
      return template.replace('{fields}', '\n\nNo hay campos SNRD configurables para este tipo de documento.')
    }

    const fieldsBlock =
      '\n\nAdemás, incluí un objeto "metadataValues" en el JSON con TODOS los siguientes campos que puedas identificar en el texto. Las claves DEBEN ser exactamente los textos en paréntesis. Para campos de tipo Select, usá UNO de los valores de opción indicados. Para campos MultiText con múltiples valores, separalos con " ; ". SI NO ENCONTRÁS UN VALOR PARA UN CAMPO, NO LO INCLUYAS en metadataValues (no uses placeholders como "No detectado" ni cadenas vacías). Completá la mayor cantidad posible:\n' +
      visibleFields
        .map((f) => {
          const currentPrompt = editedPrompts[f.id] !== undefined ? editedPrompts[f.id] : (f.aiPrompt ?? '')
          const typeHint =
            f.fieldType === 'Select' && f.options.length > 0
              ? `opciones: ${f.options.map((o) => o.value).join(', ')}`
              : f.fieldType === 'Date'
                ? 'fecha (AAAA-MM-DD)'
                : f.fieldType === 'MultiText'
                  ? 'texto (múltiples valores separados por ;)'
                  : f.fieldType === 'Textarea'
                    ? 'texto largo'
                    : 'texto'
          const guidance = currentPrompt.trim()
            ? ` | Instrucción IA: ${currentPrompt.trim()}`
            : f.helpText?.trim()
              ? ` | Guía de catalogación: ${f.helpText.trim()}`
              : ''
          return `  "${f.label} (${f.internalName}) — ${typeHint}${guidance}": "<valor extraído>"`
        })
        .join('\n')

    return template.replace('{fields}', fieldsBlock)
  }, [template, schema, schemaId, editedPrompts])

  if (!schema) {
    return (
      <div className="relative">
        <textarea
          readOnly
          value={expanded}
          rows={16}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-gray-700"
        />
        <button
          onClick={() => navigator.clipboard.writeText(expanded)}
          className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-[10px] text-gray-500 shadow-sm hover:text-iupa-green"
        >
          Copiar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Prompts por campo SNRD — {schema.label} ({schema.fields.filter((f) => !f.isHidden && !f.isReadOnly && f.obligatoriness !== 'NotApplicable').length} campos)
        </h4>
        <p className="text-xs text-gray-400">
          Editá la instrucción específica para cada metadato. Si lo dejás vacío, se usará la Guía de catalogación (HelpText) del campo. La vista previa de abajo se actualiza en vivo.
        </p>
        {schema.fields
          .filter((f) => !f.isHidden && !f.isReadOnly && f.obligatoriness !== 'NotApplicable')
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((field) => {
            const isDirty = (editedPrompts[field.id] ?? '') !== (field.aiPrompt ?? '')
            const isSaving = savingField === field.id
            return (
              <div key={field.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-800">{field.label}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{field.internalName}</span>
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">{field.fieldType}</span>
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">{field.obligatoriness}</span>
                      {field.isSimpleView && <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">vista sencilla</span>}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400">
                      {field.dublinCoreElement}
                      {field.qualifier ? `.${field.qualifier}` : ''} · orden {field.sortOrder}
                      {field.helpText ? ` · Guía: ${field.helpText}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveFieldPrompt(field)}
                    disabled={!isDirty || isSaving}
                    className={`shrink-0 rounded px-3 py-1 text-xs font-medium transition-colors ${isDirty ? 'bg-iupa-green text-white hover:bg-iupa-green/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
                <textarea
                  value={editedPrompts[field.id] ?? ''}
                  onChange={(e) => setEditedPrompts((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  placeholder={field.helpText ? `Guía actual: ${field.helpText}` : 'Instrucción específica para la IA para este campo (ej: Extrae el título tal como aparece en la portada, sin abreviaturas...)'}
                  rows={2}
                  className="w-full rounded border border-gray-200 px-2.5 py-1.5 font-mono text-xs leading-relaxed outline-none placeholder:text-gray-400 focus:border-iupa-green"
                />
                {!editedPrompts[field.id]?.trim() && field.helpText && (
                  <p className="mt-1 text-[11px] text-gray-400">Vacío: se usará la Guía de catalogación como instrucción IA.</p>
                )}
              </div>
            )
          })}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vista previa — prompt completo</h4>
          <button
            onClick={() => navigator.clipboard.writeText(expanded)}
            className="rounded bg-white px-2 py-1 text-[10px] text-gray-500 shadow-sm hover:text-iupa-green border border-gray-200"
          >
            Copiar prompt completo
          </button>
        </div>
        <textarea
          readOnly
          value={expanded}
          rows={14}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs leading-relaxed text-gray-700"
        />
      </div>
    </div>
  )
}
