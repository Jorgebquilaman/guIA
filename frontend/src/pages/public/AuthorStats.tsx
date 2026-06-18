import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Eye, BookOpen, Users, MapPin, Calendar, TrendingUp, Activity } from 'lucide-react'

interface AuthorStatsData {
  author: string
  totalDocuments: number
  totalDownloads: number
  totalViews: number
  documents: { id: string; title: string; type: string; publishedAt: string | null; status: string; authors: string[] }[]
  docsByType: { type: string; count: number }[]
  docsByYear: { year: number; count: number }[]
  downloadsByMonth: { year: number; month: number; count: number }[]
  downloadsByCountry: { country: string; count: number }[]
  coauthors: { name: string; count: number }[]
  activity30d: { date: string; count: number }[]
}

const TYPE_LABELS: Record<string, string> = {
  Article: 'Artículo',
  Thesis: 'Tesis',
  Dataset: 'Dataset',
  Software: 'Software',
  ConferenceDocument: 'Documento de conferencia',
  Book: 'Libro',
}

export default function AuthorStats() {
  const { name } = useParams<{ name: string }>()
  const [data, setData] = useState<AuthorStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    fetch(`/api/stats/author/${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => setData(d.data ?? d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [name])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-iupa-green border-t-transparent" />
      </div>
    )
  }

  if (!data) return null

  const maxDlMonth = Math.max(...data.downloadsByMonth.map((m) => m.count), 1)
  const maxCountry = Math.max(...data.downloadsByCountry.map((c) => c.count), 1)
  const maxActivity = Math.max(...data.activity30d.map((a) => a.count), 1)

  return (
    <div className="min-h-screen bg-iupa-light">
      <div className="bg-iupa-dark py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-iupa-green" />
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {data.author}
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  Estadísticas del autor — {data.totalDocuments} documento{data.totalDocuments !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Overview Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Documentos</p>
                <p className="text-xl font-bold text-iupa-dark">{data.totalDocuments}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Vistas</p>
                <p className="text-xl font-bold text-iupa-dark">{data.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Descargas</p>
                <p className="text-xl font-bold text-iupa-dark">{data.totalDownloads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Co-autores</p>
                <p className="text-xl font-bold text-iupa-dark">{data.coauthors.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Activity (last 30 days) ── */}
          {data.activity30d.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Actividad (últimos 30 días)</h2>
              </div>
              <div className="flex items-end gap-0.5" style={{ height: 100 }}>
                {data.activity30d.map((a) => (
                  <div
                    key={a.date}
                    className="flex-1 rounded-t bg-iupa-green/70 transition-all hover:bg-iupa-green"
                    style={{ height: `${(a.count / maxActivity) * 100}%`, minHeight: a.count > 0 ? 4 : 0 }}
                    title={`${a.date}: ${a.count}`}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>{data.activity30d.length > 0 ? data.activity30d[0].date.slice(5) : ''}</span>
                <span>{data.activity30d.length > 0 ? data.activity30d[data.activity30d.length - 1].date.slice(5) : ''}</span>
              </div>
            </div>
          )}

          {/* ── Downloads by Month ── */}
          {data.downloadsByMonth.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Descargas por mes</h2>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.downloadsByMonth.map((m) => {
                  const monthName = new Date(m.year, m.month - 1).toLocaleString('es', { month: 'short' })
                  return (
                    <div key={`${m.year}-${m.month}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{monthName} {m.year}</span>
                        <span className="font-semibold text-iupa-dark">{m.count}</span>
                      </div>
                      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-iupa-green transition-all" style={{ width: `${(m.count / maxDlMonth) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Docs by Type ── */}
          {data.docsByType.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Documentos por tipo</h2>
              </div>
              <div className="space-y-2">
                {data.docsByType.map((t) => (
                  <div key={t.type}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{TYPE_LABELS[t.type] || t.type}</span>
                      <span className="font-semibold text-iupa-dark">{t.count}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-blue-500/70 transition-all" style={{ width: `${(t.count / Math.max(...data.docsByType.map(x => x.count), 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Docs by Year ── */}
          {data.docsByYear.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Documentos por año</h2>
              </div>
              <div className="space-y-2">
                {data.docsByYear.map((y) => (
                  <div key={y.year}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{y.year}</span>
                      <span className="font-semibold text-iupa-dark">{y.count}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-purple-500/70 transition-all" style={{ width: `${(y.count / Math.max(...data.docsByYear.map(x => x.count), 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Downloads by Country ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Descargas por país</h2>
            </div>
            {data.downloadsByCountry.length > 0 ? (
              <div className="space-y-2">
                {data.downloadsByCountry.map((c) => (
                  <div key={c.country}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{c.country}</span>
                      <span className="font-semibold text-iupa-dark">{c.count}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-orange-500/70 transition-all" style={{ width: `${(c.count / maxCountry) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos de país disponibles</p>
            )}
          </div>

          {/* ── Co-authors ── */}
          {data.coauthors.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-iupa-green" />
                <h2 className="text-sm font-bold text-iupa-dark">Co-autores frecuentes</h2>
              </div>
              <div className="space-y-2">
                {data.coauthors.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <Link to={`/autor/${encodeURIComponent(c.name)}`} className="text-gray-700 hover:text-iupa-green hover:underline">
                      {c.name}
                    </Link>
                    <span className="font-semibold text-iupa-dark">{c.count} doc{c.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Documents List ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Documentos</h2>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5 text-xs hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <Link to={`/documentos/${doc.id}`} className="font-medium text-iupa-dark hover:text-iupa-green hover:underline">
                      {doc.title}
                    </Link>
                    <div className="mt-0.5 text-gray-400">
                      {TYPE_LABELS[doc.type] || doc.type} {doc.publishedAt ? `· ${new Date(doc.publishedAt).getFullYear()}` : ''}
                    </div>
                  </div>
                  <span className={`shrink-0 ml-3 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    doc.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {doc.status === 'Published' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400 sm:px-6 lg:px-8">
          Datos actualizados en tiempo real &middot; Instituto Universitario Patagónico de las Artes
        </div>
      </div>
    </div>
  )
}
