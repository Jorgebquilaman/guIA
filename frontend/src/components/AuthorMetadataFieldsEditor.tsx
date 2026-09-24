import type { AuthorField } from '../api/authorMetadata'

interface Props {
  fields: (AuthorField & { values?: string[] })[]
  values: Record<string, string[]>
  onChange: (fieldId: string, values: string[]) => void
}

export default function AuthorMetadataFieldsEditor({ fields, values, onChange }: Props) {
  const getRows = (f: AuthorField & { values?: string[] }): string[] => {
    const v = values[f.id]
    if (v) return v
    return f.values && f.values.length > 0 ? [...f.values] : ['']
  }

  const setRows = (f: AuthorField, rows: string[]) => onChange(f.id, rows)

  const addRow = (f: AuthorField) => setRows(f, [...getRows(f), ''])

  const removeRow = (f: AuthorField, idx: number) => {
    const rows = getRows(f).filter((_, i) => i !== idx)
    setRows(f, rows.length === 0 ? [''] : rows)
  }

  if (fields.length === 0) return null

  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const rows = getRows(f)
        const isMulti = f.isRepeatable
        const obligLabel: Record<string, string> = {
          Mandatory: 'Obligatorio',
          ConditionallyMandatory: 'Condicional',
          Recommended: 'Recomendado',
          Optional: 'Opcional',
          NotApplicable: 'No aplica',
        }
        return (
          <div key={f.id}>
            <label className="mb-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-iupa-dark">
              {f.label}
              {f.isRepeatable && (
                <span className="rounded-full bg-iupa-light px-2 py-0.5 text-[10px] font-medium text-iupa-medium">
                  repetible
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  f.obligatoriness === 'Mandatory'
                    ? 'bg-red-50 text-red-600'
                    : f.obligatoriness === 'Recommended'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-iupa-light text-iupa-medium'
                }`}
              >
                {obligLabel[f.obligatoriness] ?? f.obligatoriness}
              </span>
            </label>
            {f.helpText && <p className="mb-1.5 text-xs text-iupa-medium">{f.helpText}</p>}
            <div className="space-y-2">
              {rows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {f.fieldType === 'Textarea' ? (
                    <textarea
                      value={row}
                      onChange={(e) => setRows(f, rows.map((r, i) => (i === idx ? e.target.value : r)))}
                      rows={2}
                      className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
                    />
                  ) : f.fieldType === 'Date' ? (
                    <input
                      type="date"
                      value={row}
                      onChange={(e) => setRows(f, rows.map((r, i) => (i === idx ? e.target.value : r)))}
                      className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
                    />
                  ) : f.fieldType === 'Select' && f.options.length > 0 ? (
                    <select
                      value={row}
                      onChange={(e) => setRows(f, rows.map((r, i) => (i === idx ? e.target.value : r)))}
                      className="w-full rounded-lg border border-iupa-light bg-white px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
                    >
                      <option value="">— Elegir —</option>
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={row}
                      onChange={(e) => setRows(f, rows.map((r, i) => (i === idx ? e.target.value : r)))}
                      className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
                    />
                  )}
                  {isMulti && rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(f, idx)}
                      title="Quitar"
                      className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {isMulti && (
                <button
                  type="button"
                  onClick={() => addRow(f)}
                  className="text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
                >
                  + Agregar otro valor
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
