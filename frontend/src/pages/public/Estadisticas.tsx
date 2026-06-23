import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, FileText, Users, Eye, Download, Search, BookOpen, Layers, Award, Hash, TrendingUp, PieChart, Activity, Sparkles, UserCheck, MapPin, ArrowLeft } from 'lucide-react'

interface Stats {
  totals: {
    documents: number
    publishedDocuments: number
    authors: number
    authorsWithOrcid: number
    users: number
    collections: number
    degreePrograms: number
    views: number
    downloads: number
    searches: number
    visits: number
    uniqueVisitors: number
    documentsWithAi: number
    aiFailed: number
    viewsByCountry: { country: string; count: number }[]
    downloadsByCountry: { country: string; count: number }[]
  }
  docsByType: { type: string; count: number }[]
  docsByYear: { year: number; count: number }[]
  topAuthors: { name: string; count: number }[]
  activity30d: { date: string; count: number }[]
  docsByDepartment: { department: string; count: number }[]
  docsByDegreeProgram: { program: string; count: number }[]
  topKeywords: { word: string; count: number }[]
  docsByCollection: { collection: string; count: number }[]
  topSearches: { query: string; count: number }[]
}

const TYPE_LABELS: Record<string, string> = {
  Article: 'Artículos',
  Thesis: 'Tesis',
  ConferenceDocument: 'Ponencias',
  Book: 'Libros',
  Dataset: 'Datasets',
  Software: 'Software',
  Link: 'Enlaces',
  Other: 'Otros',
}

export default function Estadisticas() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const visitTracked = useRef(false)

  useEffect(() => {
    if (!visitTracked.current) {
      visitTracked.current = true
      fetch('/api/stats/visit', { method: 'POST' }).catch(() => {})
    }

    fetch('/api/stats/comprehensive')
      .then((r) => r.json())
      .then((d) => {
        const data = d.data ?? d
        setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-iupa-green border-t-transparent" />
      </div>
    )
  }

  if (!stats) return null

  const maxActivity = Math.max(...stats.activity30d.map((a) => a.count), 1)
  const maxType = Math.max(...stats.docsByType.map((t) => t.count), 1)

  return (
      <div className="min-h-screen bg-iupa-light">
       <div className="bg-iupa-dark py-12 text-white">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="flex items-center gap-3">
             <Link to="/" className="text-white/80 hover:text-white transition-colors">
               <ArrowLeft className="h-6 w-6" />
             </Link>
             <div className="flex items-center gap-3">
               <BarChart2 className="h-8 w-8 text-iupa-green" />
               <div>
                 <h1 className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                   Estadísticas del Repositorio
                 </h1>
                 <p className="mt-1 text-sm text-white/60">
                   Datos globales y métricas de la producción académica del IUPA
                 </p>
               </div>
             </div>
           </div>
         </div>
       </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Totals Grid ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={FileText} label="Documentos" value={stats.totals.documents} sub={`${stats.totals.publishedDocuments} publicados`} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={Users} label="Autores" value={stats.totals.authors} sub={`${stats.totals.authorsWithOrcid} con ORCID`} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard icon={Eye} label="Vistas" value={stats.totals.views} color="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={Download} label="Descargas" value={stats.totals.downloads} color="text-orange-600" bg="bg-orange-50" />
          <StatCard icon={Search} label="Búsquedas" value={stats.totals.searches} color="text-cyan-600" bg="bg-cyan-50" />
          <StatCard icon={UserCheck} label="Visitas" value={stats.totals.visits} sub={`${stats.totals.uniqueVisitors} visitantes únicos`} color="text-pink-600" bg="bg-pink-50" />
          <StatCard icon={BookOpen} label="Colecciones" value={stats.totals.collections} color="text-rose-600" bg="bg-rose-50" />
          <StatCard icon={Layers} label="Secciones Temáticas" value={stats.totals.degreePrograms} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard icon={Award} label="Usuarios" value={stats.totals.users} color="text-teal-600" bg="bg-teal-50" />
          <StatCard icon={Sparkles} label="Con IA" value={stats.totals.documentsWithAi} sub={stats.totals.aiFailed > 0 ? `${stats.totals.aiFailed} fallaron` : undefined} color="text-amber-600" bg="bg-amber-50" />
          <StatCard icon={Hash} label="Palabras clave" value={stats.topKeywords.length} sub="únicas" color="text-sky-600" bg="bg-sky-50" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Docs by Type ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Documentos por tipo</h2>
            </div>
            <div className="space-y-2">
              {stats.docsByType.map((t) => (
                <div key={t.type}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{TYPE_LABELS[t.type] || t.type}</span>
                    <span className="font-semibold text-iupa-dark">{t.count}</span>
                  </div>
                  <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-iupa-green transition-all" style={{ width: `${(t.count / maxType) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Activity 30d ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Actividad últimos 30 días</h2>
            </div>
            <div className="flex items-end gap-0.5" style={{ height: 140 }}>
              {stats.activity30d.map((a) => (
                <div
                  key={a.date}
                  className="flex-1 rounded-t bg-iupa-green/70 transition-all hover:bg-iupa-green"
                  style={{ height: `${(a.count / maxActivity) * 100}%`, minHeight: a.count > 0 ? 4 : 0 }}
                  title={`${a.date}: ${a.count} acciones`}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>{stats.activity30d.length > 0 ? stats.activity30d[0].date.slice(5) : ''}</span>
              <span>{stats.activity30d.length > 0 ? stats.activity30d[stats.activity30d.length - 1].date.slice(5) : ''}</span>
            </div>
          </div>

          {/* ── Docs by Year ── */}
          {stats.docsByYear.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Publicaciones por año</h2>
              </div>
              <div className="flex items-end gap-2" style={{ height: 140 }}>
                {(() => {
                  const maxYear = Math.max(...stats.docsByYear.map((y) => y.count), 1)
                  return stats.docsByYear.map((y) => (
                    <div key={y.year} className="flex flex-1 flex-col items-center">
                      <div
                        className="w-full rounded-t bg-orange-500/80 transition-all hover:bg-orange-500"
                        style={{ height: `${(y.count / maxYear) * 100}%`, minHeight: y.count > 0 ? 4 : 0 }}
                        title={`${y.year}: ${y.count}`}
                      />
                      <span className="mt-1 text-[10px] text-gray-400">{y.year}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}

          {/* ── Top Authors ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Autores más prolíficos</h2>
            </div>
            <div className="space-y-2">
              {stats.topAuthors.slice(0, 10).map((a, i) => (
                <div key={a.name} className="flex items-center gap-3 text-xs">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${i < 3 ? 'bg-iupa-green' : 'bg-gray-300'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-gray-700">{a.name}</span>
                  <span className="font-semibold text-iupa-dark">{a.count}</span>
                </div>
              ))}
              {stats.topAuthors.length === 0 && (
                <p className="text-xs text-gray-400">Sin datos</p>
              )}
            </div>
          </div>

          {/* ── Docs by Department ── */}
          {stats.docsByDepartment.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Documentos por red de conocimiento</h2>
              </div>
              <div className="space-y-2">
                {(() => {
                  const max = Math.max(...stats.docsByDepartment.map((d) => d.count), 1)
                  return stats.docsByDepartment.map((d) => (
                    <div key={d.department}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{d.department}</span>
                        <span className="font-semibold text-iupa-dark">{d.count}</span>
                      </div>
                      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-purple-500/70 transition-all" style={{ width: `${(d.count / max) * 100}%` }} />
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}

          {/* ── Top Keywords ── */}
          {stats.topKeywords.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Palabras clave más usadas</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const max = Math.max(...stats.topKeywords.map((k) => k.count), 1)
                  return stats.topKeywords.slice(0, 25).map((k) => {
                    const size = 0.6 + (k.count / max) * 0.6
                    return (
                      <span
                        key={k.word}
                        className="rounded-full bg-iupa-green-light px-2.5 py-1 text-xs font-medium text-iupa-green-secondary transition-all hover:bg-iupa-green hover:text-white"
                        style={{ fontSize: `${0.65 + size * 0.15}rem` }}
                        title={`${k.word}: ${k.count}`}
                      >
                        {k.word}
                      </span>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* ── Top Collections ── */}
          {stats.docsByCollection.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Documentos por colección</h2>
              </div>
              <div className="space-y-2">
                {(() => {
                  const max = Math.max(...stats.docsByCollection.map((c) => c.count), 1)
                  return stats.docsByCollection.map((c) => (
                    <div key={c.collection}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{c.collection}</span>
                        <span className="font-semibold text-iupa-dark">{c.count}</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-teal-500/70 transition-all" style={{ width: `${(c.count / max) * 100}%` }} />
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}

          {/* ── Top Searches ── */}
          {stats.topSearches.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Búsquedas más frecuentes</h2>
              </div>
              <div className="space-y-1.5">
                {stats.topSearches.slice(0, 10).map((s, i) => (
                  <div key={s.query} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-right text-gray-300">{i + 1}.</span>
                    <span className="flex-1 truncate text-gray-700">{s.query}</span>
                    <span className="font-semibold text-iupa-dark">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Geographic data for views ── */}
          {stats.totals.viewsByCountry.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Vistas por país</h2>
              </div>
              <div className="space-y-2">
                {stats.totals.viewsByCountry.map((c) => {
                  const max = Math.max(...stats.totals.viewsByCountry.map(x => x.count), 1)
                  return (
                    <div key={c.country}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{c.country}</span>
                        <span className="font-semibold text-iupa-dark">{c.count}</span>
                      </div>
                      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-violet-500/70 transition-all" style={{ width: `${(c.count / max) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Geographic data for downloads ── */}
          {stats.totals.downloadsByCountry.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Descargas por país</h2>
              </div>
              <div className="space-y-2">
                {stats.totals.downloadsByCountry.map((c) => {
                  const max = Math.max(...stats.totals.downloadsByCountry.map(x => x.count), 1)
                  return (
                    <div key={c.country}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{c.country}</span>
                        <span className="font-semibold text-iupa-dark">{c.count}</span>
                      </div>
                      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-orange-500/70 transition-all" style={{ width: `${(c.count / max) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Degree Programs ── */}
        {stats.docsByDegreeProgram.length > 0 && (
          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Documentos por sección temática</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const max = Math.max(...stats.docsByDegreeProgram.map((p) => p.count), 1)
                return stats.docsByDegreeProgram.map((p) => (
                  <div key={p.program}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{p.program}</span>
                      <span className="font-semibold text-iupa-dark">{p.count}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-amber-500/70 transition-all" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400 sm:px-6 lg:px-8">
          Datos actualizados en tiempo real &middot; Instituto Universitario Patagónico de las Artes
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  sub?: string
  color: string
  bg: string
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-iupa-dark">{value.toLocaleString()}</p>
          {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
