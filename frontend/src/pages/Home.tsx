import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchDocuments } from '../api/documents'
import { useStats } from '../api/admin'
import type { Document } from '../types'
import DocumentCard from '../components/documents/DocumentCard'
import Card from '../components/ui/Card'

const statCardColors: Record<string, { circleBg: string; iconColor: string; borderColor: string }> = {
  green: { circleBg: 'bg-iupa-green-light', iconColor: 'text-iupa-green', borderColor: 'border-l-iupa-green' },
  cyan: { circleBg: 'bg-cyan-100', iconColor: 'text-cyan-600', borderColor: 'border-l-cyan-500' },
  orange: { circleBg: 'bg-orange-100', iconColor: 'text-orange-600', borderColor: 'border-l-orange-500' },
}

function StatCard({ label, value, icon, color = 'green' }: { label: string; value: number; icon: string; color?: string }) {
  const c = statCardColors[color] ?? statCardColors.green
  return (
    <Card className={`flex items-center gap-4 border-l-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${c.borderColor}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${c.circleBg} ${c.iconColor}`}>
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <p className={`text-2xl font-bold ${c.iconColor}`}>{value.toLocaleString()}</p>
        <p className="text-sm text-iupa-medium">{label}</p>
      </div>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-7 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      </div>
    </Card>
  )
}

function DocumentCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-iupa-light bg-iupa-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-24 w-20 shrink-0 rounded bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="flex shrink-0 gap-1">
              <div className="h-5 w-16 rounded-full bg-slate-200" />
              <div className="h-5 w-16 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="flex gap-1">
            <div className="h-5 w-14 rounded bg-slate-100" />
            <div className="h-5 w-14 rounded bg-slate-100" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-iupa-light pt-3">
        <div className="h-7 w-20 rounded bg-slate-200" />
        <div className="h-7 w-16 rounded bg-slate-200" />
      </div>
    </div>
  )
}

const statIcons = {
  documents: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  downloads: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  collections: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
}

const quickActions = [
  { label: 'Buscar documentos', href: '/app/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', desc: 'Encuentra documentos por palabras clave' },
  { label: 'Explorar colecciones', href: '/app/browse', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', desc: 'Navega por colecciones temáticas' },
  { label: 'Subir documento', href: '/app/upload', icon: 'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12', desc: 'Aporta nuevos documentos al sistema' },
]

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: stats, isLoading: statsLoading } = useStats()

  const { data: recentDocs, isLoading: docsLoading } = useSearchDocuments({
    pageSize: 6,
    publicOnly: true,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="p-6">
      <div className="relative mb-10 overflow-hidden rounded-2xl px-8 py-16 text-center text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[url('/img/bg-sidebar.png')] bg-cover bg-center" />
        <div className="pointer-events-none absolute inset-0 bg-iupa-green/85" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative">
          <h1 className="mb-3 text-4xl font-bold">GuIA Documental</h1>
          <p className="mb-8 text-lg text-iupa-green-light/80">
            Sistema de gestión documental con análisis inteligente
          </p>
          <form onSubmit={handleSearch} className="mx-auto max-w-xl">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar documentos..."
                className="w-full rounded-xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:border-white/40 focus:bg-white/[0.15] focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </form>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard label="Documentos totales" value={stats.totalDocuments} icon={statIcons.documents} color="green" />
            <StatCard label="Usuarios activos" value={stats.totalUsers} icon={statIcons.downloads} color="cyan" />
            <StatCard label="Colecciones" value={stats.totalCollections} icon={statIcons.collections} color="orange" />
          </>
        ) : null}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.href}
            onClick={() => navigate(action.href)}
            className="group flex items-center gap-4 rounded-xl border border-iupa-light bg-iupa-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-iupa-green-light hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-iupa-green-light text-iupa-green transition-colors group-hover:bg-iupa-green group-hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-iupa-dark">{action.label}</p>
              <p className="text-sm text-iupa-medium">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="text-lg font-semibold text-iupa-dark">Documentos recientes</h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-1 text-sm font-medium text-iupa-green transition-colors hover:text-[#e87100]"
          >
            Ver todos
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
        {docsLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DocumentCardSkeleton key={i} />
            ))}
          </div>
        ) : recentDocs && recentDocs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(recentDocs as Document[]).slice(0, 6).map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onTitleClick={(id) => navigate(`/app/documents/${id}`)}
                onDownload={(id) => navigate(`/app/documents/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-iupa-light bg-iupa-white px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-iupa-green-light">
              <svg className="h-8 w-8 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-base font-medium text-iupa-dark">No hay documentos recientes</p>
            <p className="mt-1 text-sm text-iupa-medium">Los documentos públicos aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}
