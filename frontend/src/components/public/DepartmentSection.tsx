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

  const activeIndex = departments.findIndex((d) => d.id === activeId)

  // La pestaña activa SIEMPRE va primera (extremo izquierdo, fila inferior,
  // apoyada sobre la tarjeta) para que la ficha nunca pierda integridad.
  const orderedTabs = [...departments]
  if (activeIndex > 0) orderedTabs.unshift(...orderedTabs.splice(activeIndex, 1))

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

        <div>
          {/* Fila de pestañas estilo carpeta: la ACTIVA va primera (izquierda,
              más alta, fusionada con la tarjeta, como en la imagen de referencia);
              las demás la siguen y, si desbordan, apilan hacia arriba (wrap-reverse)
              de modo que la fila inferior siempre apoya sobre la tarjeta. */}
          {/* items-start: en wrap-reverse el eje cruzado se invierte, así que
              "start" alinea las pestañas hacia ABAJO de su fila — las pestañas
              superiores quedan apoyadas sobre las inferiores sin aire debajo. */}
          <div className="flex flex-wrap-reverse items-start gap-x-[3px] gap-y-0">
            {orderedTabs.map((dept) => {
              const Icon = ICON_MAP[dept.icon ?? '']
              const isActive = activeId === dept.id
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveId(dept.id)}
                  title={dept.name}
                  className={`group/tab relative inline-flex max-w-[190px] items-center gap-1.5 rounded-t-xl px-3 font-bold uppercase tracking-widest text-white transition-all hover:brightness-110 sm:px-4 ${
                    isActive ? 'z-20 h-11 text-[11px] sm:h-12 sm:text-xs' : 'z-0 h-7 text-[9px] sm:h-8 sm:text-[10px]'
                  }`}
                  style={{
                    backgroundColor: dept.color,
                    ...TEXTURE_STYLE,
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  {Icon && <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />}
                  <span className="truncate">{dept.name}</span>
                  {/* Tooltip con el nombre completo al pasar el mouse */}
                  <span className="pointer-events-none absolute -top-1.5 left-0 z-50 -translate-y-full whitespace-nowrap rounded-lg bg-iupa-dark px-2.5 py-1.5 text-[10px] font-semibold normal-case tracking-wide text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tab:opacity-100">
                    {dept.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tarjeta grande de la red activa */}
          {activeId && activeIndex >= 0 && (() => {
            const dept = departments[activeIndex]
            const Icon = ICON_MAP[dept.icon ?? '']
            return (
              <div
                className="relative z-10 -mt-1.5 w-full rounded-b-2xl rounded-tr-2xl px-6 py-7 text-white sm:px-10 sm:py-9"
                style={{ backgroundColor: dept.color, ...TEXTURE_STYLE }}
              >
                {/* Cabecera: número + ícono con línea */}
                <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/30 pb-3">
                  <span className="text-sm font-medium tracking-widest text-white/70">
                    {String(activeIndex + 1).padStart(2, '0')}
                  </span>
                  {Icon && <Icon className="h-5 w-5 shrink-0 text-white/80" />}
                </div>

                {/* Título grande: los nombres largos se reparten en dos líneas equilibradas */}
                <h3
                  className="mb-6 max-w-2xl text-balance break-words text-3xl font-bold leading-tight sm:mb-8 sm:text-5xl"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {dept.name}
                </h3>

                {/* Secciones temáticas */}
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  {t('departments.carreras')}
                </p>
                {dept.degreePrograms.length > 0 ? (
                  <ul className="mb-8 grid max-w-3xl gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {dept.degreePrograms.map((p) => (
                      <li key={p.id}>
                        <a
                          href={`/buscar?department=${encodeURIComponent(dept.name)}&career=${encodeURIComponent(p.name)}`}
                          className="flex items-center gap-2 rounded px-1 py-0.5 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                          <span className="underline-offset-2 hover:underline">{p.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-8 text-sm text-white/60">Sin secciones temáticas todavía</p>
                )}

                {/* Pie: conteo + botón circular de flecha */}
                <div className="mt-10 flex items-end justify-between gap-4">
                  <p className="text-xs text-white/60">
                    {dept.degreePrograms.length} sección temática{dept.degreePrograms.length !== 1 ? 's' : ''}
                  </p>
                  <a
                    href={`/buscar?department=${encodeURIComponent(dept.name)}`}
                    title={t('departments.verTrabajos')}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 transition-colors hover:bg-white/10 hover:border-white/60"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </section>
  )
}
