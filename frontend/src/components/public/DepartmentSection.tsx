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
                className="group relative flex flex-col items-center justify-center rounded-xl p-6 text-center text-white shadow-lg transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl"
                style={{
                  backgroundColor: dept.color,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='12' cy='6' r='0.8' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='22' cy='2' r='1.2' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='6' cy='14' r='1' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='18' cy='16' r='0.8' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='28' cy='12' r='1' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='4' cy='24' r='0.8' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='14' cy='26' r='1' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='24' cy='22' r='0.8' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E")`,
                }}
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

        {/* Desktop: accordion horizontal */}
        <div className="hidden md:flex h-[280px] gap-1.5">
          {departments.map((dept) => {
            const Icon = ICON_MAP[dept.icon ?? ""]
            const isActive = activeId === dept.id
            return (
              <div
                key={dept.id}
                onClick={() => setActiveId(activeId === dept.id ? dept.id : dept.id)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl ${
                  isActive ? 'flex-[3]' : 'flex-[0.4]'
                }`}
                style={{
                  backgroundColor: dept.color,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='12' cy='6' r='0.8' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='22' cy='2' r='1.2' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='6' cy='14' r='1' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='18' cy='16' r='0.8' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='28' cy='12' r='1' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='4' cy='24' r='0.8' fill='%23ffffff' fill-opacity='0.07'/%3E%3Ccircle cx='14' cy='26' r='1' fill='%23ffffff' fill-opacity='0.06'/%3E%3Ccircle cx='24' cy='22' r='0.8' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E")`,
                }}
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
                            <li key={p.id} className="flex items-center gap-2 text-sm text-white/90">
                              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                              {p.name}
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
