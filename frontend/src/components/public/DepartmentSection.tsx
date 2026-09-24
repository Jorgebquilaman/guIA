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

// Desplazamiento horizontal de cada pestaña (estilo carpeta archivadora)
const TAB_OFFSETS = ['0%', '12%', '24%', '38%', '6%', '30%', '18%', '42%']

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

        {/* Capas apiladas estilo carpeta archivadora: cada pestaña sobresale
            sobre la banda anterior y cada banda tapa el final de la anterior */}
        <div className="relative">
          {departments.map((dept, i) => {
            const Icon = ICON_MAP[dept.icon ?? '']
            const isActive = activeId === dept.id
            const isLast = i === departments.length - 1
            return (
              <div
                key={dept.id}
                className="relative"
                style={{ zIndex: i + 1, marginTop: i === 0 ? undefined : '-34px' }}
              >
                {/* Pestaña (tab) con nombre e ícono */}
                <button
                  onClick={() => setActiveId(dept.id)}
                  title={dept.name}
                  className="relative z-10 inline-flex h-7 max-w-full items-center gap-1 rounded-t-lg px-3 text-[9px] font-bold uppercase tracking-widest text-white transition-all hover:brightness-110 sm:h-8 sm:px-4 sm:text-[10px]"
                  style={{
                    backgroundColor: dept.color,
                    ...TEXTURE_STYLE,
                    fontFamily: 'Montserrat, sans-serif',
                    marginLeft: `clamp(0px, ${TAB_OFFSETS[i % TAB_OFFSETS.length]}, calc(100% - 200px))`,
                  }}
                >
                  {Icon && <Icon className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{dept.name}</span>
                </button>

                {/* Banda de color a ancho completo, continua (sin sombras).
                    Esquina superior derecha redondeada; la activa se abre un poco más. */}
                <div
                  className={`w-full rounded-tr-2xl px-4 pt-2 text-white transition-all sm:px-5 ${
                    isLast ? 'rounded-b-2xl pb-3' : isActive ? 'pb-[44px]' : 'pb-[36px]'
                  }`}
                  style={{ backgroundColor: dept.color, ...TEXTURE_STYLE }}
                >
                  {isActive ? (
                    <div className="flex min-h-[64px] flex-col justify-center gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                          {t('departments.carreras')}
                        </p>
                        {dept.degreePrograms.length > 0 ? (
                          <ul className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
                            {dept.degreePrograms.map((p) => (
                              <li key={p.id}>
                                <a
                                  href={`/buscar?department=${encodeURIComponent(dept.name)}&career=${encodeURIComponent(p.name)}`}
                                  className="flex items-center gap-2 rounded px-1 py-0.5 text-xs text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                  <span className="h-1 w-1 shrink-0 rounded-full bg-white/40" />
                                  <span className="underline-offset-2 hover:underline">{p.name}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-white/60">Sin secciones temáticas todavía</p>
                        )}
                      </div>
                      <a
                        href={`/buscar?department=${encodeURIComponent(dept.name)}`}
                        className="inline-flex shrink-0 items-center gap-1.5 self-start text-xs font-semibold text-white transition-colors hover:text-white/80"
                      >
                        {t('departments.verTrabajos')}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    /* Tira fina sin contenido: solo el color de la red */
                    null
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
