import { useState, useEffect } from 'react'
import { ArrowRight, Grid3X3, Music, Video, Palette, Move, Theater } from 'lucide-react'

interface Department {
  id: string
  name: string
  color: string
  degreePrograms: { id: string; name: string }[]
}

const deptIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Música: Music,
  'Artes Audiovisuales': Video,
  'Artes Visuales': Palette,
  Danza: Move,
  Teatro: Theater,
}

export default function DepartmentSection() {
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    fetch('/api/stats/departments')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        setDepartments(d ?? [])
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
            Explorá por departamento
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {departments.map((dept) => {
            const Icon = deptIconMap[dept.name]
            return (
              <a
                key={dept.id}
                href={`/buscar?department=${encodeURIComponent(dept.name)}`}
                className="group flex flex-col items-center rounded-xl p-6 text-center text-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ backgroundColor: dept.color }}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  {Icon && <Icon className="h-6 w-6" />}
                </div>
                <h3 className="text-sm font-bold leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {dept.name}
                </h3>
                <p className="mt-1 text-[11px] leading-tight text-white/80">
                  {dept.degreePrograms.length} carrera{dept.degreePrograms.length !== 1 ? 's' : ''}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90 transition-colors group-hover:text-white">
                  Ver trabajos
                  <ArrowRight className="h-3 w-3" />
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}