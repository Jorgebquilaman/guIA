import { useEffect, useState } from 'react'
import { FileText, GraduationCap, Users, Download, ArrowRight } from 'lucide-react'

type Stats = {
  totalDocuments: number
  totalDegreePrograms: number
  totalAuthors: number
  totalDownloads: number
}

const defaultStats: Stats = {
  totalDocuments: 0,
  totalDegreePrograms: 0,
  totalAuthors: 0,
  totalDownloads: 0,
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-AR')
}

const cards: { key: keyof Stats; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'totalDocuments', label: 'Trabajos disponibles', icon: FileText },
  { key: 'totalDegreePrograms', label: 'Carreras de grado', icon: GraduationCap },
  { key: 'totalAuthors', label: 'Autores', icon: Users },
  { key: 'totalDownloads', label: 'Descargas totales', icon: Download },
]

export default function HeroSection() {
  const [stats, setStats] = useState<Stats>(defaultStats)

  useEffect(() => {
    fetch('/api/stats/overview')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        setStats({
          totalDocuments: d.totalDocuments ?? 0,
          totalDegreePrograms: d.totalDegreePrograms ?? 0,
          totalAuthors: d.totalAuthors ?? 0,
          totalDownloads: d.totalDownloads ?? 0,
        })
      })
      .catch(() => {})
  }, [])

  return (
    <section className="relative">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/img/acceso.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#1B4D3E',
          opacity: 0.8,
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h1
              className="text-4xl leading-tight font-bold text-white sm:text-5xl lg:text-6xl"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Conocimiento que transforma{' '}
              <span className="text-iupa-accent">y crea</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90">
              Repositorio institucional del IUPA que reúne, preserva y difunde la
              producción académica, artística y científica de nuestra comunidad.
            </p>
            <a
              href="/acerca-del-repositorio"
              className="mt-7 inline-flex items-center gap-2 rounded-lg border-2 border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-iupa-green"
            >
              CONOCÉ MÁS SOBRE EL REPOSITORIO
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="relative grid grid-cols-2 gap-4">
                {cards.map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className="rounded-xl bg-white/20 p-4 shadow-sm transition-shadow hover:shadow-md border border-white/20"
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {formatNumber(stats[key])}
                    </p>
                    <p className="text-xs text-white/80">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
