import { useState, useEffect } from 'react'
import { Search, Users, Tag, Loader2, AlertCircle, Network } from 'lucide-react'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'
import ForceGraph from '../../components/graph/ForceGraph'
import { useGraph } from '../../hooks/useGraph'

export default function Relaciones() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchMode, setSearchMode] = useState<'tag' | 'author'>('tag')
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, error, refetch } = useGraph(
    searchMode === 'tag' ? query : undefined,
    searchMode === 'author' ? query : undefined
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSubmitted(true)
  }

  function handleTagClick(tag: string) {
    setSearchMode('tag')
    setQuery(tag)
    setSubmitted(true)
  }

  function handleAuthorClick(author: string) {
    setSearchMode('author')
    setQuery(author)
    setSubmitted(true)
  }

  useEffect(() => {
    if (query.trim()) {
      setSubmitted(false)
    }
  }, [query])

  return (
    <div className="min-h-screen bg-gradient-to-b from-iupa-light to-white">
      <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-iupa-green shadow-lg">
            <Network className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Mapa de Relaciones
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Explorá cómo se interconectan los documentos del repositorio a través de sus autores y etiquetas.
            Hacé clic en un documento para abrirlo o en una etiqueta para explorar sus relaciones.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setSearchMode('tag'); setSubmitted(false) }}
                className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  searchMode === 'tag'
                    ? 'border-iupa-green bg-iupa-green text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                Etiqueta
              </button>
              <button
                type="button"
                onClick={() => { setSearchMode('author'); setSubmitted(false) }}
                className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  searchMode === 'author'
                    ? 'border-iupa-green bg-iupa-green text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Autor
              </button>
            </div>

            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchMode === 'tag'
                      ? 'Ej: música, teatro, danza...'
                      : 'Ej: María González, Juan Pérez...'
                  }
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20"
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim()}
                className="rounded-lg bg-iupa-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-iupa-green/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Explorar
              </button>
            </div>
          </form>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="mb-3 h-8 w-8 animate-spin" />
            <p className="text-sm">Construyendo el mapa de relaciones...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-red-400">
            <AlertCircle className="mb-3 h-8 w-8" />
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && submitted && data && data.nodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Network className="mb-3 h-10 w-10" />
            <p className="text-sm">
              No se encontraron relaciones para {searchMode === 'tag' ? 'la etiqueta' : 'el autor'} &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {data && data.nodes.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <ForceGraph data={data} onTagClick={handleTagClick} onAuthorClick={handleAuthorClick} />
          </div>
        )}

        {!submitted && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Network className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm">Seleccioná una etiqueta o autor y presioná Explorar para comenzar</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['música', 'teatro', 'danza', 'pintura', 'performance', 'audiovisual', 'composición', 'educación'].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSearchMode('tag'); setQuery(tag); setSubmitted(true) }}
                    className="rounded-full border border-iupa-green/30 bg-white px-3 py-1 text-xs font-medium text-iupa-green transition-colors hover:bg-iupa-green hover:text-white"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
