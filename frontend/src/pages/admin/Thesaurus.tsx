import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, ChevronDown, Edit, Trash2, FolderOpen, Folder, Eye, FileText, ArrowUpDown } from 'lucide-react'
import { useI18n } from '../../i18n/context'
import client from '../../api/client'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import Card from '../../components/ui/Card'

interface ThesaurusTerm {
  id: string
  preferredLabel: string
  altLabel?: string
  definition?: string
  language: string
  type: string
  isActive: boolean
  broaderTerms?: ThesaurusTerm[]
  narrowerTerms?: ThesaurusTerm[]
  synonyms?: ThesaurusTerm[]
  relatedTerms?: ThesaurusTerm[]
  parentThesaurusId?: string
  childThesauri?: ThesaurusTerm[]
  effectiveDate?: string
  retirementDate?: string
  createdAt: string
  updatedAt: string
}

export default function ThesaurusAdmin() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [terms, setTerms] = useState<ThesaurusTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTerm, setEditingTerm] = useState<ThesaurusTerm | null>(null)
  const [deletingTerm, setDeletingTerm] = useState<ThesaurusTerm | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    preferredLabel: '',
    altLabel: '',
    definition: '',
    language: 'Español',
    type: 'Concept',
    broaderTermId: '',
    isActive: true,
    effectiveDate: '',
    retirementDate: '',
  })

  const typeOptions = [
    'Concept',
    'Subject',
    'Genre',
    'Format',
    'Identifier',
    'Classification',
    'Vocabulary',
    'Descriptor',
    'Other'
  ]

  const languageOptions = [
    'Español',
    'English',
    'Português',
    'Français',
    'Deutsch',
    'Italiano',
    '中文',
    '日本語'
  ]

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const filteredTerms = terms
    .filter(term => {
      if (searchQuery && !term.preferredLabel.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !term.altLabel?.toLowerCase().includes(searchQuery.toLowerCase())) {
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

  const buildPayload = () => ({
    preferredLabel: formData.preferredLabel.trim(),
    altLabel: formData.altLabel.trim() || null,
    definition: formData.definition.trim() || null,
    language: formData.language === 'Español' ? 'Espanol' : formData.language,
    type: formData.type,
    broaderTermId: formData.broaderTermId || null,
    isActive: formData.isActive,
    effectiveDate: formData.effectiveDate || null,
    retirementDate: formData.retirementDate || null,
  })

  const handleCreate = async () => {
    if (!formData.preferredLabel.trim()) return
    try {
      await client.post('/thesaurus/terms', buildPayload())
      setShowCreateModal(false)
      resetForm()
      loadTerms()
    } catch (error) {
      console.error('Error creating term:', error)
    }
  }

  const handleEdit = async () => {
    if (!editingTerm || !formData.preferredLabel.trim()) return
    try {
      await client.put(`/thesaurus/terms/${editingTerm.id}`, buildPayload())
      setEditingTerm(null)
      resetForm()
      loadTerms()
    } catch (error) {
      console.error('Error updating term:', error)
    }
  }

  const handleDelete = async () => {
    if (!deletingTerm) return
    try {
      await client.delete(`/thesaurus/terms/${deletingTerm.id}`)
      setDeletingTerm(null)
      loadTerms()
    } catch (error) {
      console.error('Error deleting term:', error)
    }
  }

  const openEditModal = (term: ThesaurusTerm) => {
    setEditingTerm(term)
    setFormData({
      preferredLabel: term.preferredLabel,
      altLabel: term.altLabel || '',
      definition: term.definition || '',
      language: term.language,
      type: term.type,
      broaderTermId: term.broaderTerms?.[0]?.id || '',
      isActive: term.isActive,
      effectiveDate: term.effectiveDate?.substring(0, 10) || '',
      retirementDate: term.retirementDate?.substring(0, 10) || '',
    })
  }

  const openDeleteModal = (term: ThesaurusTerm) => {
    setDeletingTerm(term)
  }

  const resetForm = () => {
    setFormData({
      preferredLabel: '',
      altLabel: '',
      definition: '',
      language: 'Español',
      type: 'Concept',
      broaderTermId: '',
      isActive: true,
      effectiveDate: '',
      retirementDate: '',
    })
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const renderTermTree = (term: ThesaurusTerm, depth: number = 0) => {
    const isExpanded = expandedIds.has(term.id)
    const hasChildren = term.narrowerTerms && term.narrowerTerms.length > 0
    const hasDefinition = !!term.definition
    const isExpandable = hasChildren || hasDefinition

    return (
      <div key={term.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 px-4 py-2 transition-colors rounded-lg hover:bg-iupa-light ${
            depth > 0 ? 'ml-6 border-l-2 border-iupa-green-light/50 pl-4' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 16}px` }}
        >
          {isExpandable ? (
            <button
              onClick={() => toggleExpand(term.id)}
              className="flex h-6 w-6 items-center justify-center text-iupa-medium hover:text-iupa-green transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="w-6" />
          )}
          <span className="flex-1 truncate font-medium text-iupa-dark">
            {term.preferredLabel}
          </span>
          <span className="text-xs text-iupa-medium uppercase">{term.type}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-iupa-light text-iupa-medium capitalize">
            {term.language}
          </span>
          {term.isActive ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Activo</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactivo</span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEditModal(term)}
              className="p-1.5 text-iupa-medium hover:bg-iupa-light hover:text-iupa-green rounded transition-colors"
              title={t('thesaurus.edit') || 'Editar'}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDeleteModal(term)}
              className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
              title={t('thesaurus.delete') || 'Eliminar'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="ml-14 mr-4 space-y-1">
            {term.broaderTerms && term.broaderTerms.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50/50 px-3 py-1.5">
                <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">TG</span>
                <span className="text-xs text-blue-700">{term.broaderTerms[0].preferredLabel}</span>
              </div>
            )}
            {term.definition && (
              <div className="rounded-lg bg-iupa-light/30 px-3 py-2 text-xs text-iupa-medium/70 leading-relaxed">
                {term.definition}
              </div>
            )}
            {hasChildren && (
              <div className="space-y-1 pt-1">
                {term.narrowerTerms?.map(child => renderTermTree(child, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
            <FolderOpen className="h-5 w-5 text-iupa-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-iupa-dark">Tesauro</h1>
            <p className="text-xs text-iupa-medium">Gestión del vocabulario controlado y relaciones semánticas</p>
          </div>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Nuevo Término
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
            <label className="sr-only">Buscar términos</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-iupa-medium" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('thesaurus.searchPlaceholder') || 'Buscar términos...'}
                className="w-full rounded-lg border border-iupa-light bg-white pl-10 pr-4 py-2 text-sm text-iupa-dark placeholder-iupa-medium/50 focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
              />
            </div>
          </form>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-[200px] rounded-lg border border-iupa-light bg-white px-4 py-2 text-sm text-iupa-dark focus:border-iupa-green focus:outline-none focus:ring-1 focus:ring-iupa-green/20"
          >
            <option value="">{t('thesaurus.allTypes') || 'Todos los tipos'}</option>
            {typeOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {filteredTerms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
                <Folder className="h-7 w-7 text-iupa-green-secondary" />
              </div>
              <p className="text-sm font-medium text-iupa-dark">No hay términos</p>
              <p className="mt-1 text-xs text-iupa-medium">Crea el primer término para comenzar el tesauro</p>
            </div>
          ) : (
            <div className="divide-y divide-iupa-light">
              {filteredTerms.map(term => renderTermTree(term))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={showCreateModal || !!editingTerm}
        onClose={() => { setShowCreateModal(false); setEditingTerm(null); resetForm() }}
        title={editingTerm ? 'Editar Término' : 'Nuevo Término'}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); editingTerm ? handleEdit() : handleCreate() }} className="space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <FileText className="h-4 w-4 text-iupa-green-secondary" />
              Término Preferido *
            </label>
            <input
              type="text"
              value={formData.preferredLabel}
              onChange={(e) => setFormData({ ...formData, preferredLabel: e.target.value })}
              placeholder="Término preferido"
              required
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <FileText className="h-4 w-4 text-iupa-green-secondary" />
              Término Alternativo
            </label>
            <input
              type="text"
              value={formData.altLabel}
              onChange={(e) => setFormData({ ...formData, altLabel: e.target.value })}
              placeholder="Sinónimo o variante"
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <FileText className="h-4 w-4 text-iupa-green-secondary" />
              Definición
            </label>
            <textarea
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
              placeholder="Definición o nota de alcance"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <FileText className="h-4 w-4 text-iupa-green-secondary" />
                Idioma
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
              >
                {languageOptions.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <FileText className="h-4 w-4 text-iupa-green-secondary" />
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
              >
                {typeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <ArrowUpDown className="h-4 w-4 text-iupa-green-secondary" />
              Término Genérico (Broader)
            </label>
            <select
              value={formData.broaderTermId}
              onChange={(e) => setFormData({ ...formData, broaderTermId: e.target.value })}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
            >
              <option value="">Ninguno (término raíz)</option>
              {terms
                .filter(t => t.id !== (editingTerm?.id || '') && t.isActive)
                .map(t => (
                  <option key={t.id} value={t.id}>{t.preferredLabel}</option>
                ))}
            </select>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <FileText className="h-4 w-4 text-iupa-green-secondary" />
                Fecha Vigencia
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <FileText className="h-4 w-4 text-iupa-green-secondary" />
                Fecha Retiro
              </label>
              <input
                type="date"
                value={formData.retirementDate}
                onChange={(e) => setFormData({ ...formData, retirementDate: e.target.value })}
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-iupa-light px-4 py-3 text-sm text-iupa-dark hover:bg-iupa-green-light/20 transition-colors">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
            />
            <div>
              <span className="font-medium">Término Activo</span>
              <p className="text-xs text-iupa-medium">Visible y disponible para uso</p>
            </div>
          </label>
          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); setEditingTerm(null); resetForm() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button onClick={(e) => { e.preventDefault(); editingTerm ? handleEdit() : handleCreate() }}>
              <Plus className="h-4 w-4" />
              {editingTerm ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deletingTerm}
        onClose={() => setDeletingTerm(null)}
        title="Eliminar Término"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">
                ¿Eliminar el término <strong>{deletingTerm?.preferredLabel}</strong>?
              </p>
              <p className="mt-1 text-xs text-red-600">
                Esta acción no se puede deshacer. Se eliminarán también las relaciones asociadas.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingTerm(null)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}