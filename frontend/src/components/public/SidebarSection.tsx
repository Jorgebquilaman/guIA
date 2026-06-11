import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Info, ArrowRight, X } from 'lucide-react'
import { tags } from '../../data/mockData'

export default function SidebarSection() {
  const [filters, setFilters] = useState({
    types: [],
    authors: [],
    degreePrograms: [],
    years: [],
  })
  const [type, setType] = useState('')
  const [author, setAuthor] = useState('')
  const [career, setCareer] = useState('')
  const [year, setYear] = useState('')
  const [siteConfig, setSiteConfig] = useState<{ showMessage: boolean; messageText: string } | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/stats/filters')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        setFilters({
          types: d.types ?? [],
          authors: d.authors ?? [],
          degreePrograms: d.degreePrograms ?? [],
          years: d.years ?? [],
        })
      })
      .catch(() => {})

    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        const shouldShow = d.showMessage ?? true
        const text = d.messageText ?? ''
        if (shouldShow && text) {
          setSiteConfig({ showMessage: true, messageText: text })
          setShowModal(true)
        } else {
          setSiteConfig({ showMessage: false, messageText: '' })
        }
      })
      .catch(() => {})
  }, [])

  function handleSearch() {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (author) params.set('author', author)
    if (career) params.set('career', career)
    if (year) params.set('year', String(year))
    window.location.href = `/buscar?${params.toString()}`
  }

    return (
    <>
    <aside className="space-y-8">
      <div className="rounded-xl border border-iupa-light bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Buscador Avanzado
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green">
            <option value="">Todos los tipos</option>
            {filters.types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={author} onChange={(e) => setAuthor(e.target.value)} className="rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green">
            <option value="">Todos los autores</option>
            {filters.authors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select value={career} onChange={(e) => setCareer(e.target.value)} className="rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green">
            <option value="">Todas las carreras</option>
            {filters.degreePrograms.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green">
            <option value="">Todos los años</option>
            {filters.years.map((y) => (
              <option key={y} value={String(y)}>{String(y)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-iupa-green px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-iupa-green-secondary"
        >
          <Search className="h-4 w-4" />
          BUSCAR
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Nube de Etiquetas
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/buscar?q=${encodeURIComponent(tag)}`}
              className="rounded-full border border-iupa-light px-3 py-1 text-xs text-iupa-medium transition-colors hover:border-iupa-green hover:text-iupa-green"
            >
              {tag}
            </a>
          ))}
        </div>
      </div>
    </aside>

    {showModal && siteConfig && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={() => setShowModal(false)}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowModal(false)}
            className="absolute right-4 top-4 rounded-full p-1 text-iupa-medium hover:bg-iupa-light hover:text-iupa-dark transition-colors"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mb-3 flex items-center gap-2 text-iupa-green">
            <Info className="h-5 w-5" />
            <h3 className="text-base font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Sobre esta página
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-iupa-medium">{siteConfig.messageText}</p>
          <Link
            to="/acerca-del-repositorio"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-iupa-accent hover:text-orange-700"
          >
            Leer más
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )}
    </>
  )
}
