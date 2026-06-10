import { useNavigate } from 'react-router-dom'
import { useStats, useAdminDocuments } from '../../api/admin'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

function Bar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const dotColors: Record<string, string> = {
    'bg-iupa-green': 'bg-iupa-green',
    'bg-emerald-500': 'bg-emerald-500',
    'bg-yellow-500': 'bg-yellow-500',
    'bg-cyan-500': 'bg-cyan-500',
    'bg-red-500': 'bg-red-500',
  }
  return (
    <div className="group flex items-center gap-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColors[color] ?? 'bg-iupa-medium'}`} />
      <span className="w-24 text-xs text-iupa-medium">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-iupa-light">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-iupa-dark">{value}</span>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  const iconConfig: Record<string, { svg: JSX.Element; circleBg: string; iconColor: string; borderColor: string }> = {
    total: {
      circleBg: 'bg-iupa-green-light',
      iconColor: 'text-iupa-green',
      borderColor: 'border-l-iupa-green',
      svg: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    published: {
      circleBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-l-emerald-500',
      svg: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    drafts: {
      circleBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-l-yellow-500',
      svg: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        </svg>
      ),
    },
    processing: {
      circleBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      borderColor: 'border-l-cyan-500',
      svg: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
      ),
    },
    rejected: {
      circleBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-l-red-500',
      svg: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }

  const cfg = iconConfig[icon] ?? iconConfig.total

  return (
    <div className={`flex items-center gap-4 rounded-xl border border-l-4 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${cfg.borderColor} border-iupa-light`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.circleBg}`}>
        <span className={cfg.iconColor}>{cfg.svg}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-iupa-medium">{label}</p>
        <p className={`text-3xl font-bold ${cfg.iconColor}`}>{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

const statusColors: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-800',
  Draft: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-cyan-100 text-cyan-800',
  Rejected: 'bg-red-100 text-red-800',
}

const barColors = [
  'bg-iupa-green',
  'bg-emerald-500',
  'bg-yellow-500',
  'bg-cyan-500',
  'bg-red-500',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: recentData, isLoading: recentLoading } = useAdminDocuments(undefined, 1, 10)

  const statusStats = stats ? [
    { label: 'Publicados', value: stats.publishedCount, color: barColors[0] },
    { label: 'Borradores', value: stats.draftCount, color: barColors[1] },
    { label: 'En proceso', value: stats.processingCount, color: barColors[2] },
    { label: 'Rechazados', value: stats.rejectedCount, color: barColors[3] },
  ] : []

  const maxStatus = Math.max(...statusStats.map((s) => s.value), 1)

  if (statsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
            <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-iupa-dark">Panel de administración</h1>
            <p className="text-xs text-iupa-medium">Resumen del estado del repositorio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/admin/documents?status=Draft')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Aprobar pendientes
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total documentos" value={stats.totalDocuments} icon="total" />
          <StatCard label="Publicados" value={stats.publishedCount} icon="published" />
          <StatCard label="Borradores" value={stats.draftCount} icon="drafts" />
          <StatCard label="En proceso" value={stats.processingCount} icon="processing" />
          <StatCard label="Rechazados" value={stats.rejectedCount} icon="rejected" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {stats && (
          <Card title="Documentos por estado">
            <div className="space-y-4 pt-1">
              {statusStats.map((s) => (
                <Bar key={s.label} label={s.label} value={s.value} max={maxStatus} color={s.color} />
              ))}
            </div>
          </Card>
        )}

        <Card title="Resumen del sistema">
          <div className="divide-y divide-iupa-light pt-1">
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-iupa-green-light">
                <svg className="h-4 w-4 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div className="flex-1 text-sm text-iupa-dark">Usuarios activos</div>
              <div className="text-sm font-bold text-iupa-dark">{stats?.totalUsers.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-iupa-green-light">
                <svg className="h-4 w-4 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <div className="flex-1 text-sm text-iupa-dark">Total colecciones</div>
              <div className="text-sm font-bold text-iupa-dark">{stats?.totalCollections.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-iupa-green-light">
                <svg className="h-4 w-4 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </div>
              <div className="flex-1 text-sm text-iupa-dark">Subidas recientes (7d)</div>
              <div className="text-sm font-bold text-iupa-dark">{stats?.recentUploads.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Subidas recientes">
        {recentLoading ? (
          <div className="space-y-3 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : recentData?.items && recentData.items.length > 0 ? (
          <div className="divide-y divide-iupa-light">
            {recentData.items.slice(0, 10).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-0 py-3 transition-all duration-150 hover:bg-iupa-green-light -mx-6 px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="shrink-0">
                    {(doc.hasCoverImage || doc.files?.[0]?.hasThumbnail) ? (
                      <img
                        src={`/api/documents/${doc.id}/thumbnail`}
                        alt=""
                        className="h-10 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-8 items-center justify-center rounded bg-iupa-light">
                        <svg className="h-4 w-4 text-iupa-medium/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => navigate(`/app/documents/${doc.id}`)}
                      className="truncate text-sm font-semibold text-iupa-dark hover:text-iupa-green transition-colors"
                    >
                      {doc.title}
                    </button>
                    <div className="flex items-center gap-3 text-xs text-iupa-medium">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {new Date(doc.uploadedAt).toLocaleDateString('es')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {doc.uploadedByName}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={doc.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'archived'}>
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
              <svg className="h-7 w-7 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-iupa-dark">No hay subidas recientes</p>
            <p className="mt-1 text-xs text-iupa-medium">Los documentos subidos aparecerán aquí</p>
          </div>
        )}
      </Card>
    </div>
  )
}
