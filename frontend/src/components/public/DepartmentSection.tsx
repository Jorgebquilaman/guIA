import { useState, useEffect, type ComponentType } from 'react'
import { Grid3X3, Music, Video, Palette, Move, Theater, BookOpen, Mic, Camera, Code, Globe, Users, Library, Pen, Star, Heart, Zap, Sun, Moon, Cloud, Sparkles, GraduationCap, Landmark, ScrollText, Cpu, Shapes, Archive, FileText } from 'lucide-react'
import { useI18n } from '../../i18n/context'
import KnowledgeFolder, { type FolderDepartment } from './KnowledgeFolder'

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Music, Video, Palette, Move, Theater, BookOpen, Mic, Camera, Code, Globe, Users, Library, Pen, Star, Heart, Zap, Sun, Moon, Cloud,
  Sparkles, GraduationCap, Landmark, ScrollText, Cpu, Shapes, Archive, FileText,
}

// Fallback por nombre de red para las que no tienen ícono asignado
const NAME_ICON: Record<string, ComponentType<{ className?: string }>> = {
  'Patrimonio Integral': Landmark,
  'Sistemas': Cpu,
  'Escuela de Arte Popular': Shapes,
  'Editorial': BookOpen,
  'Normativa Institucional': ScrollText,
  'Investigación y Posgrado': GraduationCap,
}

function resolveIcon(dept: FolderDepartment): ComponentType<{ className?: string }> | null {
  return ICON_MAP[dept.icon ?? ''] ?? NAME_ICON[dept.name] ?? null
}

export default function DepartmentSection() {
  const [departments, setDepartments] = useState<FolderDepartment[]>([])
  const { t } = useI18n()

  useEffect(() => {
    fetch('/api/stats/departments')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        setDepartments((d ?? []).sort((a: FolderDepartment, b: FolderDepartment) => a.name.localeCompare(b.name, 'es')))
      })
      .catch(() => {})
  }, [])

  return (
    <section className="overflow-x-clip bg-iupa-light py-12">
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

        {/* Carpetas interactivas: una por red de conocimiento */}
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {departments.map((dept) => (
            <KnowledgeFolder key={dept.id} department={dept} Icon={resolveIcon(dept)} />
          ))}
        </div>
      </div>
    </section>
  )
}
