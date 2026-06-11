import { useState, useEffect } from 'react'
import type { Document, DocumentType, DocumentAuthor, Department } from '../../types'
import { useUpdateMetadata, useAiSuggestions, useDocumentTypes, useDepartments } from '../../api/documents'

interface MetadataEditorProps {
  document: Document
  onCancel: () => void
  onSaved: () => void
}

const LANGUAGES = [
  'Español',
  'English',
  'Português',
  'Français',
  'Deutsch',
  'Italiano',
  '中文',
  '日本語',
  'Otro',
]

const DEFAULT_INSTITUTION = 'Instituto Universitario Patagónico de las Artes'
const DEFAULT_LICENSE = 'CC BY-NC-ND 4.0'

export default function MetadataEditor({
  document,
  onCancel,
  onSaved,
}: MetadataEditorProps) {
  const [title, setTitle] = useState(document.title)
  const [description, setDescription] = useState(document.description ?? '')
  const [type, setType] = useState<DocumentType>(document.type)
  const [language, setLanguage] = useState(
    document.aiMetadata?.language ?? 'Español',
  )
  const [authors, setAuthors] = useState<DocumentAuthor[]>(
    document.authors.map((a) => ({ ...a })),
  )
  const [keywords, setKeywords] = useState<string[]>([...document.keywords])

  // Dublin Core fields
  const [advisorName, setAdvisorName] = useState(document.advisorName ?? '')
  const [institution, setInstitution] = useState(document.institution ?? DEFAULT_INSTITUTION)
  const [publicationDate, setPublicationDate] = useState(
    document.publicationDate ? document.publicationDate.substring(0, 10) : '',
  )
  const [abstractEs, setAbstractEs] = useState(document.abstractEs ?? '')
  const [license, setLicense] = useState(document.license ?? DEFAULT_LICENSE)
  const [department, setDepartment] = useState(document.department ?? '')
  const [degreeProgram, setDegreeProgram] = useState(document.degreeProgram ?? '')

  const [newAuthorName, setNewAuthorName] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const mutation = useUpdateMetadata(document.id)
  const { data: aiSuggestions, refetch: fetchAiSuggestions } = useAiSuggestions(document.id)
  const { data: typeDefs } = useDocumentTypes()
  const { data: departments } = useDepartments()
  const isLink = !!document.sourceUrl

  useEffect(() => {
    if (aiSuggestions && !aiLoading) return
    if (!aiSuggestions) return
    if (aiSuggestions.description && !description)
      setDescription(aiSuggestions.description)
    if (aiSuggestions.abstractEs && !abstractEs)
      setAbstractEs(aiSuggestions.abstractEs)
    if (aiSuggestions.suggestedKeywords && keywords.length === 0)
      setKeywords(aiSuggestions.suggestedKeywords)
    if (aiSuggestions.suggestedAuthors && authors.length === 0)
      setAuthors(
        aiSuggestions.suggestedAuthors.map((a, i) => ({
          id: crypto.randomUUID(),
          name: a.name,
          email: a.email ?? null,
          orcid: a.orcid ?? null,
          order: a.order || i + 1,
        })),
      )
    if (aiSuggestions.suggestedType) {
      const validTypes: DocumentType[] = ['Article', 'Thesis', 'Dataset', 'Software', 'Other']
      if (validTypes.includes(aiSuggestions.suggestedType as DocumentType))
        setType(aiSuggestions.suggestedType as DocumentType)
    }
    setAiLoading(false)
  }, [aiSuggestions])

  const handleAiFill = async () => {
    setAiLoading(true)
    await fetchAiSuggestions()
  }

  const addAuthor = () => {
    if (!newAuthorName.trim()) return
    const nextOrder = authors.length > 0 ? Math.max(...authors.map((a) => a.order)) + 1 : 1
    setAuthors([
      ...authors,
      {
        id: crypto.randomUUID(),
        name: newAuthorName.trim(),
        email: null,
        orcid: null,
        order: nextOrder,
      },
    ])
    setNewAuthorName('')
  }

  const removeAuthor = (id: string) => {
    setAuthors(authors.filter((a) => a.id !== id))
  }

  const moveAuthor = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= authors.length) return
    const copy = [...authors]
    const temp = copy[index].order
    copy[index].order = copy[target].order
    copy[target].order = temp
    copy.sort((a, b) => a.order - b.order)
    setAuthors(copy)
  }

  const addKeyword = () => {
    if (!newKeyword.trim()) return
    setKeywords([...keywords, newKeyword.trim()])
    setNewKeyword('')
  }

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw))
  }

  const handleSave = async () => {
    await mutation.mutateAsync({
      title,
      description: description || null,
      type,
      authors: authors.map((a) => ({ name: a.name, email: a.email, orcid: a.orcid, order: a.order })),
      keywords,
      advisorName: advisorName || null,
      institution: institution || null,
      publicationDate: publicationDate ? new Date(publicationDate).toISOString() : null,
      abstractEs: abstractEs || null,
      license: license || null,
      department: department || null,
      degreeProgram: degreeProgram || null,
      language: language !== 'Español' ? language : null,
    })
    onSaved()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-iupa-dark mb-1">Metadatos del documento</h2>
        <p className="text-sm text-iupa-medium">Completá los campos según el estándar Dublin Core (Ley 26.899)</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
            Título <span className="text-xs text-iupa-medium font-normal">(dc.title) *</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
          />
        </div>

        {!isLink && (
          <div className="flex items-center justify-between rounded-lg border border-iupa-green-light bg-iupa-green-light/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-iupa-green">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813 2.846a4.5 4.5 0 01-3.09 3.09L2.25 22.5l.375-.375L2.25 22.5l1.846-.813A4.5 4.5 0 019 18.75l.813-2.846" />
              </svg>
              <span className="font-medium">Completar con IA</span>
              <span className="text-iupa-medium font-normal">Analiza el documento y sugiere valores para los campos</span>
            </div>
            <button
              onClick={handleAiFill}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-iupa-green px-4 py-2 text-sm font-medium text-white hover:bg-iupa-green-secondary disabled:opacity-50 transition-colors"
            >
              {aiLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analizando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813 2.846a4.5 4.5 0 01-3.09 3.09L2.25 22.5l.375-.375L2.25 22.5l1.846-.813A4.5 4.5 0 019 18.75l.813-2.846" />
                  </svg>
                  Completar
                </>
              )}
            </button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Tipo de documento <span className="text-xs text-iupa-medium font-normal">(dc.type) *</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            >
              {(typeDefs ?? []).map((t) => (
                <option key={t.id} value={t.name}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Idioma <span className="text-xs text-iupa-medium font-normal">(dc.language) *</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
            Descripción <span className="text-xs text-iupa-medium font-normal">(dc.description)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
          />
        </div>
      </div>

      <div className="border-t border-iupa-light pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-iupa-medium mb-4">
          Autores y palabras clave
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Autor/Tutor <span className="text-xs text-iupa-medium font-normal">(dc.contributor.advisor)</span>
            </label>
            <input
              type="text"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              placeholder="Nombre del tutor o director"
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Institución <span className="text-xs text-iupa-medium font-normal">(dc.publisher) *</span>
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-iupa-dark">
            Autores <span className="text-xs text-iupa-medium font-normal">(dc.creator) *</span>
          </label>
          {authors.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {authors.map((author, i) => (
                <div
                  key={author.id}
                  className="flex items-center justify-between rounded-lg border border-iupa-light bg-white px-3.5 py-2 text-sm shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-iupa-green-light text-xs font-medium text-iupa-green">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-iupa-dark font-medium">{author.name}</span>
                      {i === 0 && <span className="ml-2 text-xs text-iupa-medium">(principal)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveAuthor(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1 text-iupa-medium/60 hover:bg-iupa-light hover:text-iupa-green disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Mover arriba"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveAuthor(i, 1)}
                      disabled={i === authors.length - 1}
                      className="rounded p-1 text-iupa-medium/60 hover:bg-iupa-light hover:text-iupa-green disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Mover abajo"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeAuthor(author.id)}
                      className="rounded p-1 text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Eliminar autor"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAuthor()}
              placeholder="Nombre del autor"
              className="flex-1 rounded-lg border border-iupa-light bg-white px-3.5 py-2 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            />
            <button
              onClick={addAuthor}
              className="inline-flex items-center gap-1.5 rounded-lg border border-iupa-green-light bg-iupa-green-light/50 px-3.5 py-2 text-sm font-medium text-iupa-green hover:bg-iupa-green-light transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </button>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-iupa-dark">
            Palabras clave <span className="text-xs text-iupa-medium font-normal">(dc.subject) *</span>
          </label>
          {keywords.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-iupa-light px-2.5 py-1 text-xs font-medium text-iupa-dark ring-1 ring-inset ring-iupa-light"
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="text-iupa-medium/50 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="Nueva palabra clave"
              className="flex-1 rounded-lg border border-iupa-light bg-white px-3.5 py-2 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            />
            <button
              onClick={addKeyword}
              className="inline-flex items-center gap-1.5 rounded-lg border border-iupa-green-light bg-iupa-green-light/50 px-3.5 py-2 text-sm font-medium text-iupa-green hover:bg-iupa-green-light transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-iupa-light pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-iupa-medium mb-4">
          Metadatos Dublin Core
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Fecha de publicación <span className="text-xs text-iupa-medium font-normal">(dc.date.issued) *</span>
            </label>
            <input
              type="date"
              value={publicationDate}
              onChange={(e) => setPublicationDate(e.target.value)}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Licencia <span className="text-xs text-iupa-medium font-normal">(dc.rights.license) *</span>
            </label>
            <input
              type="text"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Departamento <span className="text-xs text-iupa-medium font-normal">(dc.coverage.spatial)</span>
            </label>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value)
                setDegreeProgram('')
              }}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            >
              <option value="">Seleccionar departamento</option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Carrera <span className="text-xs text-iupa-medium font-normal">(dc.relation.ispartofseries)</span>
            </label>
            <select
              value={degreeProgram}
              onChange={(e) => setDegreeProgram(e.target.value)}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
            >
              <option value="">Seleccionar carrera</option>
              {(departments ?? [])
                .filter((d) => d.name === department)
                .flatMap((d) => d.degreePrograms)
                .map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
            Resumen en español <span className="text-xs text-iupa-medium font-normal">(dc.description.abstract) *</span>
          </label>
          <textarea
            value={abstractEs}
            onChange={(e) => setAbstractEs(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 transition-colors focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-iupa-light pt-5">
        <button
          onClick={onCancel}
          className="rounded-lg border border-iupa-light bg-white px-5 py-2.5 text-sm font-medium text-iupa-dark hover:bg-iupa-green-light/50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-iupa-green px-5 py-2.5 text-sm font-medium text-white hover:bg-iupa-green-secondary disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </div>
  )
}
