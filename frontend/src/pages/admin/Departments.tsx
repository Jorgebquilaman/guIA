import { useState } from 'react'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useAddDegreeProgram, useRemoveDegreeProgram } from '../../api/admin'
import { useUiStore } from '../../store/uiStore'
import type { Department } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import {
  Music, Video, Palette, Move, Theater, BookOpen, Mic, Camera, Code, Globe, Users, Library, Pen,
  Star, Heart, Zap, Sun, Moon, Cloud, Sparkles, Flower2, TreePine, Mountain, Waves, Flame,
  Gem, Diamond, Trophy, Target, Compass, Map, Leaf, Droplets, Feather, Bird, Shell,
  Cat, Dog, Rabbit, Fish, Footprints, Hand, Eye, Ear, Wind, Sunrise, Sunset
} from 'lucide-react'

interface FormState {
  id?: string
  name: string
  color: string
  icon: string | null
  degreePrograms: string[]
}

const emptyForm: FormState = { name: '', color: '#1B4D3E', icon: null, degreePrograms: [] }

const PRESET_COLORS = [
  '#1B4D3E', '#2D7A6B', '#E87100', '#C0392B', '#2980B9',
  '#8E44AD', '#27AE60', '#D35400', '#16A085', '#7F8C8D',
  '#E74C3C', '#F39C12', '#2ECC71', '#3498DB', '#9B59B6',
  '#1ABC9C', '#E67E22', '#2C3E50', '#95A5A6', '#34495E',
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6F91',
  '#845EC2', '#0081CF', '#00C9A7', '#FF9671', '#B39DDB',
]

const ICON_OPTIONS = [
  { name: 'Music', icon: Music },
  { name: 'Video', icon: Video },
  { name: 'Palette', icon: Palette },
  { name: 'Move', icon: Move },
  { name: 'Theater', icon: Theater },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Mic', icon: Mic },
  { name: 'Camera', icon: Camera },
  { name: 'Code', icon: Code },
  { name: 'Globe', icon: Globe },
  { name: 'Users', icon: Users },
  { name: 'Library', icon: Library },
  { name: 'Pen', icon: Pen },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'Sun', icon: Sun },
  { name: 'Moon', icon: Moon },
  { name: 'Cloud', icon: Cloud },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Flower2', icon: Flower2 },
  { name: 'TreePine', icon: TreePine },
  { name: 'Mountain', icon: Mountain },
  { name: 'Waves', icon: Waves },
  { name: 'Flame', icon: Flame },
  { name: 'Gem', icon: Gem },
  { name: 'Diamond', icon: Diamond },
  { name: 'Trophy', icon: Trophy },
  { name: 'Target', icon: Target },
  { name: 'Compass', icon: Compass },
  { name: 'Map', icon: Map },
  { name: 'Leaf', icon: Leaf },
  { name: 'Droplets', icon: Droplets },
  { name: 'Feather', icon: Feather },
  { name: 'Bird', icon: Bird },
  { name: 'Shell', icon: Shell },
  { name: 'Cat', icon: Cat },
  { name: 'Dog', icon: Dog },
  { name: 'Rabbit', icon: Rabbit },
  { name: 'Fish', icon: Fish },
  { name: 'Footprints', icon: Footprints },
  { name: 'Hand', icon: Hand },
  { name: 'Eye', icon: Eye },
  { name: 'Ear', icon: Ear },
  { name: 'Wind', icon: Wind },
  { name: 'Sunrise', icon: Sunrise },
  { name: 'Sunset', icon: Sunset },
]

export default function Departments() {
  const { data: departments, isLoading } = useDepartments()
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()
  const deleteMutation = useDeleteDepartment()
  const addToast = useUiStore((s) => s.addToast)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newProgram, setNewProgram] = useState('')
  const [inlineNewProgram, setInlineNewProgram] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const addProgramMutation = useAddDegreeProgram()
  const removeProgramMutation = useRemoveDegreeProgram()

  const handleAddProgram = () => {
    if (!newProgram.trim()) return
    setForm({ ...form, degreePrograms: [...form.degreePrograms, newProgram.trim()] })
    setNewProgram('')
  }

  const handleRemoveProgram = (index: number) => {
    setForm({ ...form, degreePrograms: form.degreePrograms.filter((_, i) => i !== index) })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      if (editing && form.id) {
        await updateMutation.mutateAsync({
          id: form.id,
          name: form.name,
          color: form.color,
          icon: form.icon,
          degreePrograms: form.degreePrograms.filter(Boolean),
        })
        addToast('success', 'Red de Conocimiento actualizada')
      } else {
        await createMutation.mutateAsync({
          name: form.name,
          color: form.color,
          icon: form.icon,
          degreePrograms: form.degreePrograms.filter(Boolean),
        })
        addToast('success', 'Red de Conocimiento creada')
      }
      setForm(emptyForm)
      setEditing(false)
      setShowModal(false)
    } catch {
      addToast('error', 'Error al guardar la red de conocimiento')
    }
  }

  const handleEdit = (d: Department) => {
    setForm({
      id: d.id,
      name: d.name,
      color: d.color,
      icon: d.icon ?? null,
      degreePrograms: d.degreePrograms.map((p) => p.name),
    })
    setEditing(true)
    setExpandedId(d.id)
    setShowModal(true)
  }

  const handleOpenNew = () => {
    setForm(emptyForm)
    setEditing(false)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setForm(emptyForm)
    setEditing(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta red de conocimiento? También se eliminarán sus secciones temáticas.')) return
    try {
      await deleteMutation.mutateAsync(id)
      addToast('success', 'Red de Conocimiento eliminada')
    } catch {
      addToast('error', 'Error al eliminar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
          <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-4.5-3.75V6" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-iupa-dark">Redes de Conocimiento y secciones temáticas</h1>
          <p className="text-xs text-iupa-medium">Gestioná las redes de conocimiento y sus secciones temáticas</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={handleOpenNew}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva red de conocimiento
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <h2 className="text-sm font-semibold text-iupa-dark">Redes de Conocimiento existentes</h2>
          <span className="rounded-full bg-iupa-green-light px-2.5 py-0.5 text-xs font-medium text-iupa-green">
            {departments?.length ?? 0}
          </span>
        </div>

        {departments?.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
                <svg className="h-7 w-7 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <p className="text-sm font-medium text-iupa-dark">No hay redes de conocimiento configuradas</p>
              <p className="mt-1 text-xs text-iupa-medium">Creá tu primera red de conocimiento usando el formulario de arriba</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {departments?.map((d) => (
              <Card key={d.id} className="overflow-hidden !p-0">
                <div
                  className="flex cursor-pointer items-center justify-between px-5 py-4 transition-all duration-150 hover:bg-iupa-green-light/40"
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  style={{ borderLeft: `4px solid ${d.color}` }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm"
                      style={{ backgroundColor: d.color }}
                    >
                      <span className="text-sm font-bold text-white drop-shadow-sm">
                        {d.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-iupa-dark">{d.name}</span>
                      <span className="ml-2 rounded-full bg-iupa-light px-2 py-0.5 text-xs font-medium text-iupa-medium">
                        {d.degreePrograms.length} sección temática{d.degreePrograms.length !== 1 ? 's' : ''}
                      </span>
                      {d.degreePrograms.length > 0 && (
                        <div className="mt-1 flex max-w-md flex-wrap gap-1">
                          {d.degreePrograms.slice(0, 3).map((p) => (
                            <span
                              key={p.id}
                              className="truncate rounded-md bg-iupa-green-light/50 px-1.5 py-0.5 text-[10px] font-medium text-iupa-green-secondary"
                            >
                              {p.name}
                            </span>
                          ))}
                          {d.degreePrograms.length > 3 && (
                            <span className="rounded-md bg-iupa-light px-1.5 py-0.5 text-[10px] font-medium text-iupa-medium">
                              +{d.degreePrograms.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(d)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-iupa-green-secondary hover:bg-iupa-green-light transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Eliminar
                    </button>
                    <div
                      className={`ml-1 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
                        expandedId === d.id ? 'rotate-180 bg-iupa-green-light' : 'bg-transparent'
                      }`}
                    >
                      <svg
                        className={`h-4 w-4 text-iupa-medium transition-transform duration-200 ${expandedId === d.id ? 'text-iupa-green' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    expandedId === d.id ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-iupa-light bg-iupa-green-light/20 px-5 py-4">
                    {d.degreePrograms.length === 0 ? (
                      <div className="flex items-center gap-2 py-2">
                        <svg className="h-4 w-4 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v7.5m0 0H5.25m4.5 0h4.5M9.75 3.75h-4.5m4.5 0v-1.5m0 2.25h4.5M4.5 12.75h15m-15 6H18" />
                        </svg>
                        <p className="text-xs font-medium text-iupa-medium">Sin secciones temáticas configuradas</p>
                      </div>
                    ) : (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {d.degreePrograms.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-iupa-dark shadow-sm ring-1 ring-inset ring-iupa-light transition-all hover:shadow-md"
                          >
                            <svg className="h-3 w-3 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {p.name}
                            <button
                              onClick={async () => {
                                try {
                                  await removeProgramMutation.mutateAsync({ departmentId: d.id, programId: p.id })
                                  addToast('success', 'Sección Temática eliminada')
                                } catch {
                                  addToast('error', 'Error al eliminar sección temática')
                                }
                              }}
                              disabled={removeProgramMutation.isPending}
                              className="ml-0.5 rounded-full p-0.5 text-iupa-medium/50 hover:bg-red-100 hover:text-red-500 disabled:opacity-30 transition-colors"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={inlineNewProgram}
                          onChange={(e) => setInlineNewProgram(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && inlineNewProgram.trim()) {
                              try {
                                await addProgramMutation.mutateAsync({ departmentId: d.id, name: inlineNewProgram.trim() })
                                addToast('success', 'Sección Temática agregada')
                                setInlineNewProgram('')
                              } catch {
                                addToast('error', 'Error al agregar sección temática')
                              }
                            }
                          }}
                          placeholder="Agregar sección temática..."
                          className="w-full rounded-lg border border-iupa-light bg-white px-3 py-1.5 pr-8 text-xs text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
                        />
                        {inlineNewProgram.trim() && (
                          <button
                            onClick={async () => {
                              if (!inlineNewProgram.trim()) return
                              try {
                                await addProgramMutation.mutateAsync({ departmentId: d.id, name: inlineNewProgram.trim() })
                                addToast('success', 'Sección Temática agregada')
                                setInlineNewProgram('')
                              } catch {
                                addToast('error', 'Error al agregar sección temática')
                              }
                            }}
                            disabled={addProgramMutation.isPending}
                            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-iupa-green hover:bg-iupa-green-light disabled:opacity-50 transition-colors"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          if (!inlineNewProgram.trim()) return
                          try {
                            await addProgramMutation.mutateAsync({ departmentId: d.id, name: inlineNewProgram.trim() })
                            addToast('success', 'Sección Temática agregada')
                            setInlineNewProgram('')
                          } catch {
                            addToast('error', 'Error al agregar sección temática')
                          }
                        }}
                        disabled={!inlineNewProgram.trim() || addProgramMutation.isPending}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={handleCloseModal} title={editing ? 'Editar red de conocimiento' : 'Nueva red de conocimiento'} size="2xl">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                Nombre de la red de conocimiento
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Música"
                className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                  <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072" />
                  </svg>
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div
                      className="flex h-10 w-14 items-center justify-center rounded-lg border border-iupa-light shadow-sm transition-shadow hover:shadow-md cursor-pointer"
                      style={{ backgroundColor: form.color }}
                    >
                      <span className="text-[10px] font-bold text-white drop-shadow-md">{form.color}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className={`h-8 w-8 shrink-0 rounded-full shadow-sm transition-all duration-150 hover:scale-110 hover:shadow-md ${
                          form.color === c ? 'ring-2 ring-iupa-dark ring-offset-2 scale-110' : 'ring-1 ring-black/10'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
                  <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Icono
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {ICON_OPTIONS.map((opt) => {
                    const SelectedIcon = opt.icon
                    const isSelected = form.icon === opt.name
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setForm({ ...form, icon: isSelected ? null : opt.name })}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all ${
                          isSelected
                            ? 'border-iupa-green bg-iupa-green text-white shadow-sm'
                            : 'border-iupa-light text-iupa-medium hover:border-iupa-green/40 hover:text-iupa-green hover:shadow-sm'
                        }`}
                        title={opt.name}
                      >
                        <SelectedIcon className="h-4 w-4" />
                      </button>
                    )
                  })}
                  {form.icon && <div className="ml-1 flex items-center text-xs text-iupa-medium">{ICON_OPTIONS.find(o => o.name === form.icon)?.name ?? form.icon}</div>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 11.383a2.474 2.474 0 01.479-1.05L8.5 5.517a2.474 2.474 0 013.542-.163l2.21 2.108a2.474 2.474 0 01.162 3.542l-3.767 3.767a2.474 2.474 0 01-3.542.162l-2.11-2.107a2.474 2.474 0 01-.736-1.439z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5l3 3" />
              </svg>
              Secciones temáticas de la red de conocimiento
            </label>
            {form.degreePrograms.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {form.degreePrograms.map((prog, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-iupa-green-light bg-iupa-green-light/60 px-3 py-1 text-xs font-medium text-iupa-green-secondary shadow-sm"
                  >
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {prog}
                    <button
                      onClick={() => handleRemoveProgram(i)}
                      className="ml-0.5 rounded-full p-0.5 text-iupa-green-secondary/50 hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newProgram}
                  onChange={(e) => setNewProgram(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProgram()}
                  placeholder="Nombre de la sección temática"
                  className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 pr-10 text-sm text-iupa-dark placeholder:text-iupa-medium/50 focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
                />
                {newProgram.trim() && (
                  <button
                    onClick={handleAddProgram}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-iupa-green hover:bg-iupa-green-light transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                )}
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleAddProgram}
                disabled={!newProgram.trim()}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Agregar
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            <Button variant="ghost" onClick={handleCloseModal}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {editing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                )}
              </svg>
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
