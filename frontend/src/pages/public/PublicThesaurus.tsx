import { useState, useEffect } from 'react'
import { Search, ChevronRight, ChevronDown, BookOpen, FileText, Globe } from 'lucide-react'
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

  const renderTermTree = (term: ThesaurusTerm, depth: number = 0) => {
    const isExpanded = expandedIds.has(term.id)
    const children = getChildren(term.id)

    return (
      <div key={term.id}>
        <div
          className={`group flex items-center gap-2 rounded-lg px-4 py-2.5 transition-colors hover:bg-iupa-light cursor-pointer ${
            depth > 0 ? 'ml-7 border-l-2 border-iupa-green-light/30 pl-4' : 'border-l-2 border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 16 + 16}px` }}
          onClick={() => toggleExpand(term.id)}
        >
          {(children.length > 0 || term.definition) ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(term.id) }}
              className="flex h-6 w-6 items-center justify-center text-iupa-medium hover:text-iupa-green transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-iupa-medium/40" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-iupa-dark truncate block">
              {term.preferredLabel}
            </span>
            {term.altLabel && (
              <span className="text-xs text-iupa-medium/60 italic block truncate">
                {term.altLabel}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[11px] uppercase tracking-wider text-iupa-medium/50 bg-iupa-light px-2 py-0.5 rounded-full">
            {term.type}
          </span>
          <span className="shrink-0 text-xs text-iupa-medium/40">
            <Globe className="h-3 w-3" />
          </span>
        </div>
        {isExpanded && (
          <div className="ml-14 mr-4 mb-2 space-y-1">
            {term.broaderTerms && term.broaderTerms.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50/50 px-3 py-1.5">
                <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">TG</span>
                <span className="text-xs text-blue-700">{term.broaderTerms[0].preferredLabel}</span>
              </div>
            )}
            {term.definition && (
              <div className="rounded-lg bg-iupa-light/30 px-3 py-2">
                <p className="text-xs text-iupa-medium/70 leading-relaxed">{term.definition}</p>
              </div>
            )}
            {children.length > 0 && (
              <div className="space-y-0.5 pt-1">
                {children.map(child => renderTermTree(child, depth + 1))}
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
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-iupa-light bg-white shadow-sm">
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
            <div className="divide-y divide-iupa-light/50 py-2">
              {rootTerms.map(term => renderTermTree(term))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-iupa-medium/40">
          {t('thesaurus.totalTerms') || 'Total de términos'}: {terms.length}
        </div>
      </main>

      <Footer />
    </div>
  )
}
