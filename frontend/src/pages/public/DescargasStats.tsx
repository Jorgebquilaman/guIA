import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, MapPin, Clock, FileText, TrendingUp, Calendar, Award, ArrowLeft } from 'lucide-react'

interface DownloadStats {
  totalDownloads: number
  downloadsToday: number
  downloadsThisWeek: number
  downloadsThisMonth: number
  downloadsByDay: { date: string; count: number }[]
  downloadsByMonth: { year: number; month: number; count: number }[]
  topDocuments: { documentId: string; title: string; type: string; downloads: number }[]
  downloadsByCountry: { country: string; count: number }[]
  downloadsByType: { type: string; count: number }[]
  recentDownloads: { documentId: string; title: string | null; country: string | null; ipAddress: string | null; occurredAt: string }[]
}

export default function DescargasStats() {
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/downloads')
      .then((r) => r.json())
      .then((d) => setStats(d.data ?? d))
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

  const maxDownloadsDay = Math.max(...stats.downloadsByDay.map((d) => d.count), 1)
  const maxDownloadsMonth = Math.max(...stats.downloadsByMonth.map((m) => m.count), 1)
  const maxDownloadsCountry = Math.max(...stats.downloadsByCountry.map((c) => c.count), 1)

  return (
    <div className="min-h-screen bg-iupa-light">
      <div className="bg-iupa-dark py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-iupa-green" />
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Estadísticas de Descargas
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  Análisis detallado de descargas de documentos, países y tendencias temporales
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Overview Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Download} label="Total descargas" value={stats.totalDownloads} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={Clock} label="Hoy" value={stats.downloadsToday} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard icon={Calendar} label="Esta semana" value={stats.downloadsThisWeek} color="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={Calendar} label="Este mes" value={stats.downloadsThisMonth} color="text-orange-600" bg="bg-orange-50" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Downloads by Day (Last 90 Days) ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Descargas por día (últimos 90 días)</h2>
            </div>
            <div className="flex items-end gap-0.5" style={{ height: 140 }}>
              {stats.downloadsByDay.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 rounded-t bg-iupa-green/70 transition-all hover:bg-iupa-green"
                  style={{ height: `${(d.count / maxDownloadsDay) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                  title={`${d.date}: ${d.count} descargas`}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>{stats.downloadsByDay.length > 0 ? stats.downloadsByDay[0].date.slice(5) : ''}</span>
              <span>{stats.downloadsByDay.length > 0 ? stats.downloadsByDay[stats.downloadsByDay.length - 1].date.slice(5) : ''}</span>
            </div>
          </div>

          {/* ── Downloads by Month ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Descargas por mes</h2>
            </div>
            <div className="space-y-2">
              {stats.downloadsByMonth.map((m) => {
                const monthName = new Date(m.year, m.month - 1).toLocaleString('es', { month: 'short' })
                return (
                  <div key={`${m.year}-${m.month}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{monthName} {m.year}</span>
                      <span className="font-semibold text-iupa-dark">{m.count}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-iupa-green transition-all" style={{ width: `${(m.count / maxDownloadsMonth) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Top Downloaded Documents ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Documentos más descargados</h2>
            </div>
            <div className="space-y-2">
              {stats.topDocuments.map((d, i) => (
                <div key={d.documentId} className="flex items-center gap-3 text-xs">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${i < 3 ? 'bg-iupa-green' : 'bg-gray-300'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-gray-700" title={d.title}>{d.title}</span>
                  <span className="text-xs text-gray-400">{d.type}</span>
                  <span className="font-semibold text-iupa-dark">{d.downloads}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Downloads by Country ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Descargas por país</h2>
            </div>
            {stats.downloadsByCountry.length > 0 ? (
              <div className="space-y-2">
                {stats.downloadsByCountry.map((c) => (
                  <div key={c.country}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{c.country}</span>
                      <span className="font-semibold text-iupa-dark">{c.count}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-purple-500/70 transition-all" style={{ width: `${(c.count / maxDownloadsCountry) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos de país — las descargas anteriores no incluyen geolocalización</p>
            )}
          </div>

          {/* ── Downloads by Document Type ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Descargas por tipo de documento</h2>
            </div>
            <div className="space-y-2">
              {stats.downloadsByType.map((t) => (
                <div key={t.type}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{t.type}</span>
                    <span className="font-semibold text-iupa-dark">{t.count}</span>
                  </div>
                  <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-teal-500/70 transition-all" style={{ width: `${(t.count / Math.max(...stats.downloadsByType.map(x => x.count), 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent Downloads ── */}
          <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-iupa-green" />
              <h2 className="text-sm font-bold text-iupa-dark">Descargas recientes</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.recentDownloads.map((r, i) => (
                <div key={`${r.documentId}-${i}`} className="flex items-center justify-between text-xs">
                  <div className="flex-1 truncate">
                    <span className="font-medium text-gray-700">{r.title || 'Documento eliminado'}</span>
                    {r.country && (
                      <span className="ml-2 inline-flex items-center gap-1 text-gray-400">
                        <MapPin className="h-3 w-3" /> {r.country}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500">{new Date(r.occurredAt).toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                    {r.ipAddress && (
                      <div className="text-[10px] text-gray-400">IP: {r.ipAddress}</div>
                    )}
                  </div>
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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
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
        </div>
      </div>
    </div>
  )
}
