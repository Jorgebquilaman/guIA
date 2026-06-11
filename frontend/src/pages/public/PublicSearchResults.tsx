import { useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import SearchResults from '../../components/search/SearchResults'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function PublicSearchResults() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)

  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? ''
  const author = searchParams.get('author') ?? ''
  const career = searchParams.get('career') ?? ''
  const year = searchParams.get('year') ?? ''
  const department = searchParams.get('department') ?? ''
  const collection = searchParams.get('collection') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const keywords = searchParams.get('keywords') ?? ''

  const searchQuery = useMemo(() => {
    const params: Record<string, string | number | boolean> = { page, pageSize: 20, publicOnly: true }
    if (q) params.q = q
    if (type) params.type = type
    if (author) params.author = author
    if (career) params.career = career
    if (year) params.year = year
    if (department) params.department = department
    if (collection) params.collection = collection
    if (keywords) params.keywords = keywords
    return params
  }, [q, type, author, career, year, keywords, department, collection, page])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-search', searchQuery],
    queryFn: async () => {
      const { data: res } = await client.get('/search', { params: searchQuery })
      const d = res.data ?? res
      return {
        query: q,
        items: d.items ?? [],
        totalCount: d.totalCount ?? 0,
        page: d.page ?? 1,
        pageSize: d.pageSize ?? 20,
        facets: d.facets ?? {},
      }
    },
  })

  function updateParams(updates: Record<string, string | undefined>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') {
          next.delete(key)
        } else {
          next.set(key, value)
        }
      }
      if (updates.q !== undefined) next.set('page', '1')
      return next
    })
  }

  function handleLocalSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateParams({ q: (formData.get('q') as string) || undefined })
  }

  // Fetch filter options from API
  const [departments, setDepartments] = useState([])
  const [collections, setCollections] = useState([])

  useEffect(() => {
    fetch('/api/stats/departments')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        setDepartments(d ?? [])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <form onSubmit={handleLocalSearch} className="relative mx-auto max-w-2xl">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar documentos..."
              className="w-full rounded-xl border border-iupa-light px-5 py-3.5 pr-12 text-sm text-iupa-dark outline-none transition-colors focus:border-iupa-green"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-iupa-medium hover:text-iupa-green"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <aside className="w-full shrink-0 lg:w-60">
            <div className="rounded-xl border border-iupa-light bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Filtros
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-iupa-medium">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => updateParams({ type: e.target.value || undefined, page: '1' })}
                    className="w-full rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green"
                  >
                    <option value="">Todos</option>
                    <option value="Article">Artículo</option>
                    <option value="Thesis">Tesis</option>
                    <option value="Dataset">Dataset</option>
                    <option value="Software">Software</option>
                    <option value="Link">Enlace</option>
                    <option value="Other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-iupa-medium">Departamento</label>
                  <select
                    value={department}
                    onChange={(e) => updateParams({ department: e.target.value || undefined, page: '1' })}
                    className="w-full rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green"
                  >
                    <option value="">Todos los departamentos</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-iupa-medium">Autor</label>
                  <select
                    value={author}
                    onChange={(e) => updateParams({ author: e.target.value || undefined, page: '1' })}
                    className="w-full rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green"
                  >
                    <option value="">Todos los autores</option>
                    <option value="Néstor Guestrin">Néstor Guestrin</option>
                    <option value="Julio Espinosa Fernández">Julio Espinosa Fernández</option>
                    <option value="Fernando Rull Pérez">Fernando Rull Pérez</option>
                    <option value="Ainhoa Valderrey Sanz">Ainhoa Valderrey Sanz</option>
                    <option value="David Carabias Galindo">David Carabias Galindo</option>
                    <option value="Melanie Plesch">Melanie Plesch</option>
                    <option value="Néstor Guestrin">Néstor Guestrin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-iupa-medium">Carrera</label>
                  <select
                    value={career}
                    onChange={(e) => updateParams({ career: e.target.value || undefined, page: '1' })}
                    className="w-full rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green"
                  >
                    <option value="">Todas las carreras</option>
                    <option value="Licenciatura en Realización Audiovisual">Licenciatura en Realización Audiovisual</option>
                    <option value="Licenciatura en Composición Musical">Licenciatura en Composición Musical</option>
                    <option value="Licenciatura en Danza">Licenciatura en Danza</option>
                    <option value="Licenciatura en Teatro">Licenciatura en Teatro</option>
                    <option value="Licenciatura en Artes Visuales">Licenciatura en Artes Visuales</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-iupa-medium">Año</label>
                  <select
                    value={year}
                    onChange={(e) => updateParams({ year: e.target.value ? parseInt(e.target.value) : undefined, page: '1' })}
                    className="w-full rounded-lg border border-iupa-light px-3 py-2 text-xs text-iupa-dark outline-none focus:border-iupa-green"
                  >
                    <option value="">Todos los años</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {}}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-iupa-green px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-iupa-green-secondary"
              >
                <Search className="h-4 w-4" />
                BUSCAR
              </button>
            </div>
          </aside>

          <main className="mt-6 flex-1 lg:mt-0">
            <SearchResults
              results={data ?? null}
              loading={isLoading}
              error={isError ? (error instanceof Error ? error.message : 'Error al cargar resultados') : null}
              onPageChange={(p) => updateParams({ page: String(p) })}
              onTitleClick={(id) => navigate(`/documentos/${id}`)}
              onDownload={(id) => navigate(`/documentos/${id}`)}
            />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  )
}