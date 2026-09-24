import { useState, useEffect, type ComponentType } from 'react'
import { ArrowRight, Grid3X3, Music, Video, Palette, Move, Theater, BookOpen, Mic, Camera, Code, Globe, Users, Library, Pen, Star, Heart, Zap, Sun, Moon, Cloud } from 'lucide-react'
import { useI18n } from '../../i18n/context'

interface Department {
  id: string
  name: string
  color: string
  icon: string | null
  degreePrograms: { id: string; name: string }[]
}

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Music, Video, Palette, Move, Theater, BookOpen, Mic, Camera, Code, Globe, Users, Library, Pen, Star, Heart, Zap, Sun, Moon, Cloud,
}

// Textura de lienzo compartida, teñida con el color de cada red vía blend
const TEXTURE_STYLE = {
  backgroundImage: `url('/img/texture-paper.png')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundBlendMode: 'multiply',
} as const

export default function DepartmentSection() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const { t } = useI18n()

  useEffect(() => {
    fetch('/api/stats/departments')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        setDepartments((d ?? []).sort((a: Department, b: Department) => a.name.localeCompare(b.name, 'es')))
        if (d?.[0]) setActiveId(d[0].id)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="bg-iupa-light py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-iupa-green" />
          <h2
            className="text-xl font-bold text-iupa-dark"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {t('departments.titulo')}
          </h2>
        </div>

        {/* Mobile: grid layout */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
          {departments.map((dept) => {
            const Icon = ICON_MAP[dept.icon ?? ""]
            return (
              <a
                key={dept.id}
                href={`/buscar?department=${encodeURIComponent(dept.name)}`}
                className="group relative flex flex-col items-center justify-center rounded-r-xl p-6 text-center text-white shadow-lg transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl [&:nth-child(even)]:z-10 [&:nth-child(even)]:-ml-6 [&:nth-child(odd)]:z-20 sm:[&:nth-child(3n)]:z-10 sm:[&:nth-child(3n)]:-ml-6 sm:[&:nth-child(3n+1)]:z-30 sm:[&:nth-child(3n+1)]:ml-0 sm:[&:nth-child(3n+2)]:z-20 sm:[&:nth-child(3n+2)]:-ml-6"
                style={{ backgroundColor: dept.color, ...TEXTURE_STYLE }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 shadow-inner">
                  {Icon && <Icon className="h-6 w-6" />}
                </div>
                <div className="my-2 w-8 border-b border-white/30" />
                <h3 className="w-full text-center text-sm font-bold leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {dept.name}
                </h3>
                <p className="w-full text-center text-[11px] leading-tight text-white/80">
                  {dept.degreePrograms.length} sección temática{dept.degreePrograms.length !== 1 ? 's' : ''}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/90 transition-colors group-hover:text-white">
                  {t('departments.verTrabajos')}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </a>
            )
          })}
        </div>

        {/* Desktop: accordion horizontal.
            Cada panel se desliza 16px (el radio) por debajo del anterior,
            de modo que su borde recto "completa" la esquina redondeada del vecino. */}
        <div className="hidden md:flex h-[280px]">
          {departments.map((dept, i) => {
            const Icon = ICON_MAP[dept.icon ?? ""]
            const isActive = activeId === dept.id
            return (
              <div
                key={dept.id}
                onClick={() => setActiveId(activeId === dept.id ? dept.id : dept.id)}
                style={{
                  backgroundColor: dept.color,
                  ...TEXTURE_STYLE,
                  zIndex: departments.length - i,
                  marginLeft: i > 0 ? '-16px' : undefined,
                }}
                className={`relative cursor-pointer overflow-hidden rounded-r-2xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl ${
                  isActive ? 'flex-[3]' : 'flex-[0.4]'
                }`}
              >
                {/* Título vertical (colapsado) */}
                {!isActive && (
                  <div className="flex h-full w-full items-center justify-center">
                    <span
                      className="select-none text-sm font-bold uppercase tracking-widest text-white/90"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      {dept.name}
                    </span>
                  </div>
                )}

                {/* Contenido expandido */}
                {isActive && (
                  <div className="flex h-full flex-col p-6 text-white">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shadow-inner">
                        {Icon && <Icon className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {dept.name}
                        </h3>
                        <p className="text-xs text-white/70">
                          {dept.degreePrograms.length} sección temática{dept.degreePrograms.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mb-4 w-full border-b border-white/30" />

                    {dept.degreePrograms.length > 0 && (
                      <div className="mb-4 flex-1">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
                          {t('departments.carreras')}
                        </p>
                        <ul className="space-y-1">
                          {dept.degreePrograms.map((p) => (
                            <li key={p.id}>
                              <a
                                href={`/buscar?department=${encodeURIComponent(dept.name)}&career=${encodeURIComponent(p.name)}`}
                                className="group/item flex items-center gap-2 rounded px-1 py-0.5 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                              >
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/40 transition-colors group-hover/item:bg-white" />
                                <span className="underline-offset-2 group-hover/item:underline">{p.name}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <a
                      href={`/buscar?department=${encodeURIComponent(dept.name)}`}
                      className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-white/80"
                    >
                      {t('departments.verTrabajos')}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
