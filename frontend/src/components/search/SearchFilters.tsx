import { useState } from 'react'
import type { DocumentType, Collection } from '../../types'
import { useDocumentTypes } from '../../api/documents'
import CollectionTreeComponent from '../collections/CollectionTree'

interface SearchFiltersValue {
  types: DocumentType[]
  collectionId: string | null
  dateFrom: string
  dateTo: string
  language: string
}

interface SearchFiltersProps {
  filters: SearchFiltersValue
  onChange: (filters: SearchFiltersValue) => void
  collections: Collection[]
}

const LANGUAGES = [
  '',
  'English',
  'Spanish',
  'Portuguese',
  'French',
  'German',
  'Italian',
  'Chinese',
  'Japanese',
]

export default function SearchFilters({ filters, onChange, collections }: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const { data: typeDefs } = useDocumentTypes()

  const update = (patch: Partial<SearchFiltersValue>) => {
    const next = { ...localFilters, ...patch }
    setLocalFilters(next)
    onChange(next)
  }

  const clearAll = () => {
    const cleared: SearchFiltersValue = {
      types: [],
      collectionId: null,
      dateFrom: '',
      dateTo: '',
      language: '',
    }
    setLocalFilters(cleared)
    onChange(cleared)
  }

  const toggleType = (type: DocumentType) => {
    const types = localFilters.types.includes(type)
      ? localFilters.types.filter((t) => t !== type)
      : [...localFilters.types, type]
    update({ types })
  }

  const hasActiveFilters =
    localFilters.types.length > 0 ||
    localFilters.collectionId !== null ||
    localFilters.dateFrom !== '' ||
    localFilters.dateTo !== '' ||
    localFilters.language !== ''

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h4l2 2h7a2 2 0 012 2v2M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-iupa-dark">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-iupa-green hover:text-iupa-green-secondary transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-iupa-medium">
          <svg className="h-3.5 w-3.5 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Tipo de documento
        </h4>
        <div className="flex flex-wrap gap-2">
          {(typeDefs ?? []).map((td) => {
            const selected = localFilters.types.includes(td.name as DocumentType)
            return (
              <button
                key={td.id}
                type="button"
                onClick={() => toggleType(td.name as DocumentType)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selected
                    ? 'bg-iupa-green text-white shadow-sm'
                    : 'border border-iupa-light bg-white text-iupa-dark hover:border-iupa-green hover:text-iupa-green'
                }`}
              >
                {selected && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {td.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-iupa-medium">
          <svg className="h-3.5 w-3.5 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Colección
        </h4>
        <CollectionTreeComponent
          selectedCollectionId={localFilters.collectionId ?? undefined}
          onSelect={(c) =>
            update({
              collectionId:
                c.id === localFilters.collectionId ? null : c.id,
            })
          }
        />
      </div>

      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-iupa-medium">
          <svg className="h-3.5 w-3.5 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Rango de fechas
        </h4>
        <div className="space-y-2">
          <input
            type="date"
            value={localFilters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="w-full rounded border border-iupa-light px-2 py-1.5 text-sm focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            placeholder="Desde"
          />
          <input
            type="date"
            value={localFilters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="w-full rounded border border-iupa-light px-2 py-1.5 text-sm focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            placeholder="Hasta"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-iupa-medium">
          <svg className="h-3.5 w-3.5 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Idioma
        </h4>
        <select
          value={localFilters.language}
          onChange={(e) => update({ language: e.target.value })}
          className="w-full rounded border border-iupa-light px-2 py-1.5 text-sm focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang || 'Todos los idiomas'}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
