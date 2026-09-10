import { useState, useEffect } from 'react'
import { Search, ChevronRight, BookOpen, FileText, Globe, ArrowRight } from 'lucide-react'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'
import { useI18n } from '../../i18n/context'
import client from '../../api/client'

interface ThesaurusTerm {
  id: string
  preferredLabel: string
  altLabel?: string
  definition?: string
  language: string
  type: string
  isActive: boolean
  narrowerTerms?: { id: string; preferredLabel: string }[]
  broaderTerms?: { id: string; preferredLabel: string }[]
  parentThesaurusId?: string
  childThesauri?: { id: string; preferredLabel: string }[]
  createdAt: string
}

export default function PublicThesaurus() {
  const { t } = useI18n()
  const [terms, setTerms] = useState<ThesaurusTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)

  const typeOptions = ['Concept', 'Subject', 'Genre', 'Format', 'Identifier', 'Classification', 'Vocabulary', 'Descriptor', 'Other']

  useEffect(() => {
    loadTerms()
  }, [])

  const loadTerms = async () => {
    setLoading(true)
    try {
      const response = await client.get<ThesaurusTerm[]>('/thesaurus/terms')
      if (response.data) {
        setTerms(response.data)
      }
    } catch (error) {
      console.error('Error loading terms:', error)
    } finally {
      setLoading(false)
    }
  }

  const findAllAncestors = (termId: string): ThesaurusTerm[] => {
    const term = terms.find(t => t.id === termId)
    if (!term || !term.broaderTerms || term.broaderTerms.length === 0) return []
    const parent = terms.find(t => t.id === term.broaderTerms![0].id)
    if (!parent) return [term]
    return [...findAllAncestors(parent.id), parent]
  }

  const rootTerms = terms
    .filter(term => {
      if (searchQuery && !term.preferredLabel.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !term.altLabel?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !term.definition?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (selectedType && term.type !== selectedType) {
        return false
      }
      return true
    })
    .filter(term => !term.parentThesaurusId)

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getChildren = (parentId: string) => terms.filter(t => t.parentThesaurusId === parentId)

  const renderTermRow = (term: ThesaurusTerm, depth: number = 0) => {
    const isExpanded = expandedIds.has(term.id)
    const children = getChildren(term.id)
    const ancestors = findAllAncestors(term.id)

    return (
      <div key={term.id}>
        <div
          className="group flex items-center gap-2 rounded-lg px-4 py-2.5 transition-colors hover:bg-iupa-light cursor-pointer"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
          onClick={() => toggleExpand(term.id)}
        >
          {(children.length > 0 || term.definition) ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(term.id) }}
              className="flex h-6 w-6 shrink-0 items-center justify-center text-iupa-medium hover:text-iupa-green transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-iupa-medium/30" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-iupa-dark truncate">{term.preferredLabel}</span>
              {ancestors.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-iupa-medium/40">
                  <ArrowRight className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{ancestors.map(a => a.preferredLabel).join(' > ')}</span>
                </span>
              )}
            </div>
            {term.altLabel && (
              <span className="text-xs text-iupa-medium/50 italic block truncate">{term.altLabel}</span>
            )}
          </div>
          <span className="shrink-0 text-[11px] uppercase tracking-wider text-iupa-medium/40 bg-iupa-light px-2 py-0.5 rounded-full">
            {t('thesaurus.type_' + term.type) || term.type}
          </span>
          {ancestors.length > 0 && (
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-blue-500/60 bg-blue-50/50 px-2 py-0.5 rounded-full">
              <ArrowRight className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{ancestors[ancestors.length - 1].preferredLabel}</span>
            </span>
          )}
          <span className="shrink-0 text-xs text-iupa-medium/30">
            <Globe className="h-3 w-3" />
          </span>
        </div>
        {isExpanded && (
          <div className="ml-14 mr-4 mb-2 space-y-1.5">
            {ancestors.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50/60 px-3 py-2">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider shrink-0">TG</span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-blue-700">
                  {ancestors.map((a, i) => (
                    <span key={a.id} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-blue-400">›</span>}
                      <span className="font-medium">{a.preferredLabel}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {children.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-green-50/60 px-3 py-2">
                <span className="text-[11px] font-bold text-green-600 uppercase tracking-wider shrink-0 mt-0.5">TE</span>
                <div className="flex flex-wrap gap-1.5">
                  {children.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-green-100/70 px-2 py-0.5 text-xs font-medium text-green-700">
                      {c.preferredLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {term.definition && (
              <div className="rounded-lg bg-iupa-light/40 px-3 py-2">
                <p className="text-xs text-iupa-medium/70 leading-relaxed">{term.definition}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar onMenuToggle={() => setMenuOpen(!menuOpen)} menuOpen={menuOpen} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-iupa-green-light">
            <BookOpen className="h-7 w-7 text-iupa-green" />
          </div>
          <h1 className="text-2xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {t('thesaurus.publicTitle') || 'Tesauro'}
          </h1>
          <p className="mt-1 text-sm text-iupa-medium">
            {t('thesaurus.publicSubtitle') || 'Vocabulario controlado del repositorio'}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-iupa-medium/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('thesaurus.searchPlaceholder') || 'Buscar términos...'}
              className="w-full rounded-xl border border-iupa-light bg-white pl-10 pr-4 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/40 focus:border-iupa-green focus:outline-none focus:ring-2 focus:ring-iupa-green/20"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-[180px] rounded-xl border border-iupa-light bg-white px-4 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:outline-none focus:ring-2 focus:ring-iupa-green/20"
          >
            <option value="">{t('thesaurus.allTypes') || 'Todos los tipos'}</option>
            {typeOptions.map(type => (
              <option key={type} value={type}>{t('thesaurus.type_' + type) || type}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-iupa-light bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-iupa-green border-t-transparent" />
            </div>
          ) : rootTerms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-iupa-green-light/50">
                <BookOpen className="h-8 w-8 text-iupa-green-secondary/50" />
              </div>
              <p className="text-sm font-medium text-iupa-dark">{t('thesaurus.noTerms') || 'No hay términos disponibles'}</p>
              <p className="mt-1 text-xs text-iupa-medium">{t('thesaurus.noTermsDescription') || 'El tesauro está en construcción'}</p>
            </div>
          ) : (
            <div className="divide-y divide-iupa-light/50">
              {rootTerms.map(term => renderTermRow(term))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-iupa-medium/40">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-blue-50 border border-blue-200" />
            TG = Término Genérico (broader)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-green-50 border border-green-200" />
            TE = Término Específico (narrower)
          </span>
          <span>{t('thesaurus.totalTerms') || 'Total de términos'}: {terms.length}</span>
        </div>
      </main>

      <Footer />
    </div>
  )
}
