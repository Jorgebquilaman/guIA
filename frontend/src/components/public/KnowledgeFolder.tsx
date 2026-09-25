import { useEffect, useRef, useState, type ComponentType } from 'react'
import { FileText, X } from 'lucide-react'
import { withFileToken } from '../../utils/files'

export interface FolderDepartment {
  id: string
  name: string
  color: string
  icon: string | null
  degreePrograms: { id: string; name: string }[]
}

interface DeckItem {
  id?: string
  title: string
  image: string | null
  kind: 'doc' | 'career'
}

/** Parámetros de la animación (fácil de ajustar) */
export const FOLDER_CONFIG = {
  maxItems: 12,
  fanAngle: 3.2,      // grados entre cada item del abanico
  fanSpreadX: 46,     // px horizontales entre items
  liftY: 6,           // arco vertical del abanico (px por unidad de distancia)
  staggerMs: 45,      // demora entre la aparición de cada item
  openMs: 550,        // duración de la secuencia de apertura
  closeMs: 320,       // duración del cierre
  tiltMax: 7,         // inclinación 3D máxima en hover (grados)
} as const

const EASE_SPRING = 'cubic-bezier(0.34, 1.4, 0.64, 1)'
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

const TEXTURE = {
  backgroundImage: `url('/img/texture-paper.png')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundBlendMode: 'multiply',
} as const

// Jitter determinístico por índice (sin Math.random: estable entre renders)
const jitter = (i: number, mod: number, offset: number) => ((i * 37 + i * i * 5) % mod) - offset

export default function KnowledgeFolder({
  department,
  Icon,
}: {
  department: FolderDepartment
  Icon: ComponentType<{ className?: string }> | null
}) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [items, setItems] = useState<DeckItem[] | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const n = items?.length ?? 0
  const phase = open ? (closing ? 'closing' : 'open') : 'closed'

  useEffect(() => {
    if (!open || items) return
    fetch(`/api/search?department=${encodeURIComponent(department.name)}&pageSize=${FOLDER_CONFIG.maxItems}&publicOnly=true`)
      .then((r) => r.json())
      .then((d) => {
        const docs: DeckItem[] = (d.data?.items ?? []).slice(0, FOLDER_CONFIG.maxItems).map((doc: {
          id: string; title: string; hasCoverImage?: boolean; files?: { hasThumbnail: boolean }[]
        }) => ({
          id: doc.id,
          title: doc.title,
          image: doc.hasCoverImage || doc.files?.[0]?.hasThumbnail
            ? `/api/documents/${doc.id}/thumbnail`
            : null,
          kind: 'doc' as const,
        }))
        // Si la red tiene pocos documentos, completar el mazo con sus carreras
        const careers: DeckItem[] = department.degreePrograms.map((p) => ({
          title: p.name,
          image: null,
          kind: 'career' as const,
        }))
        setItems([...docs, ...careers].slice(0, FOLDER_CONFIG.maxItems))
      })
      .catch(() =>
        setItems(department.degreePrograms.map((p) => ({ title: p.name, image: null, kind: 'career' as const }))),
      )
  }, [open, items, department])

  const close = () => {
    if (closing || !open) return
    setClosing(true)
    closeTimer.current = setTimeout(() => {
      setOpen(false)
      setClosing(false)
      setItems(null)
      setHovered(null)
    }, FOLDER_CONFIG.closeMs + 80)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing])

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  return (
    <>
      {/* ── Tarjeta carpeta en reposo ── */}
      <button
        onClick={() => setOpen(true)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          setTilt({ x: nx, y: ny })
          setCursor({ x: e.clientX, y: e.clientY })
        }}
        onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setCursor(null) }}
        className="group relative block w-full cursor-pointer text-left"
        style={{ perspective: '800px' }}
      >
        {/* Solapa de la carpeta */}
        <div
          className="relative mx-3 rounded-t-xl px-4 pt-2"
          style={{ backgroundColor: department.color, ...TEXTURE }}
        >
          <div className="h-2" />
        </div>
        {/* Cuerpo con tilt 3D + flotación idle */}
        <div
          className="relative overflow-hidden rounded-b-2xl px-5 pb-6 pt-5 text-white shadow-xl"
          style={{
            backgroundColor: department.color,
            ...TEXTURE,
            transform: `rotateX(${(-tilt.y * FOLDER_CONFIG.tiltMax).toFixed(2)}deg) rotateY(${(tilt.x * FOLDER_CONFIG.tiltMax).toFixed(2)}deg)`,
            transition: `transform 250ms ${EASE_OUT}`,
            transformStyle: 'preserve-3d',
            animation:
              tilt.x === 0 && tilt.y === 0
                ? `folder-float ${(6 + (department.name.length % 4))}s ease-in-out infinite`
                : undefined,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-white"
            style={{ animation: 'folder-shine 5s ease-in-out infinite' }}
          />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shadow-inner">
              {Icon && <Icon className="h-6 w-6" />}
            </div>
            <h3 className="mt-3 text-base font-bold leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {department.name}
            </h3>
            <p className="mt-1 text-[11px] text-white/70">
              {department.degreePrograms.length} sección temática{department.degreePrograms.length !== 1 ? 's' : ''}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
              Abrir carpeta
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.5.177.526.214 1.097.04 1.615l-.03.03a8.42 8.42 0 01-.04.03V16.5l-.03.03A9.479 9.479 0 0112 19.5c-4.638 0-8.573-3.007-9.963-7.5a9.766 9.766 0 01-.037-1.97zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Cursor custom: burbuja "Abrir" que sigue al mouse (recortada al viewport
            para no generar scroll horizontal cuando el cursor está en el borde) */}
        {cursor && (
          <span
            className="pointer-events-none fixed z-50 rounded-full bg-iupa-dark px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg"
            style={{
              left: Math.min(cursor.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 92),
              top: Math.min(cursor.y + 14, (typeof window !== 'undefined' ? window.innerHeight : 9999) - 44),
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Abrir
          </span>
        )}
      </button>

      {/* ── Overlay: carpeta abierta ── */}
      {(open || closing) && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(23, 43, 36, 0.72)', backdropFilter: 'blur(6px)' }}
          onClick={close}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{
              backgroundColor: department.color,
              ...TEXTURE,
              animation: `folder-pop ${FOLDER_CONFIG.openMs}ms ${EASE_SPRING}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-white/25 px-5 py-4 sm:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                  {Icon && <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {department.name}
                  </h3>
                  <p className="text-[11px] text-white/60">
                    {items ? `${n} documento${n !== 1 ? 's' : ''} en la carpeta` : 'Abriendo…'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" /> Volver
              </button>
            </div>

            {/* Contenido en abanico */}
            <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden py-10 sm:min-h-[360px]">
              {items === null ? (
                <div className="h-32 w-24 animate-pulse rounded-lg bg-white/15" />
              ) : n === 0 ? (
                <p className="text-sm text-white/70">Todavía no hay publicaciones en esta red.</p>
              ) : (
                items.map((item, i) => {
                  const mid = (n - 1) / 2
                  const off = i - mid
                  const opened = phase === 'open'
                  const rotation = off * FOLDER_CONFIG.fanAngle + jitter(i, 7, 3) * 0.5
                  const tx = opened ? off * FOLDER_CONFIG.fanSpreadX + jitter(i, 15, 7) : 0
                  const ty = opened ? Math.abs(off) * FOLDER_CONFIG.liftY * -0.35 + jitter(i, 11, 5) : 0
                  const isHovered = hovered === i
                  const isDimmed = hovered !== null && !isHovered
                  const delay = closing ? (n - 1 - i) * 18 : i * FOLDER_CONFIG.staggerMs
                  return (
                    <div
                      key={item.id ?? `${item.kind}-${i}`}
                      className="absolute left-1/2 top-1/2 cursor-pointer"
                      style={{
                        zIndex: isHovered ? 60 : 10 + i,
                        transform: `translate(-50%, -50%) translateX(${tx}px) translateY(${ty}px) rotate(${rotation}deg) scale(${opened ? (isHovered ? 1.12 : 1) : 0.55})`,
                        opacity: opened ? 1 : 0,
                        transition: `transform ${FOLDER_CONFIG.openMs}ms ${EASE_SPRING} ${delay}ms, opacity ${FOLDER_CONFIG.openMs * 0.6}ms ease ${delay}ms, filter 200ms ease`,
                        filter: isDimmed ? 'brightness(0.72)' : 'none',
                      }}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => {
                        if (item.kind === 'doc' && item.id) window.location.href = `/documentos/${item.id}`
                        else if (item.kind === 'career')
                          window.location.href = `/buscar?department=${encodeURIComponent(department.name)}&career=${encodeURIComponent(item.title)}`
                      }}
                    >
                      <div
                        className="flex h-40 w-32 flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:h-48 sm:w-36"
                        style={{
                          transform: isHovered ? 'translateY(-14px)' : 'none',
                          transition: `transform 220ms ${EASE_OUT}`,
                        }}
                      >
                        <div
                          className="flex items-center gap-1 border-b border-white/20 px-2 py-1.5"
                          style={{ backgroundColor: department.color }}
                        >
                          <FileText className="h-3 w-3 text-white" />
                          <span className="truncate text-[8px] font-bold uppercase tracking-wider text-white">
                            {item.kind === 'career' ? 'Sección' : 'Documento'}
                          </span>
                        </div>
                        {item.image ? (
                          <img
                            src={withFileToken(item.image)}
                            alt={item.title}
                            className="min-h-0 flex-1 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="flex flex-1 items-center justify-center bg-iupa-light/80 p-2 text-center">
                            <span
                              className="line-clamp-3 px-1 text-[11px] font-semibold leading-tight"
                              style={{ color: department.color }}
                            >
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Etiqueta al hacer hover */}
                      <div
                        className="pointer-events-none absolute -bottom-9 left-1/2 w-max max-w-[220px] rounded-lg bg-iupa-dark px-2.5 py-1.5 text-center text-[10px] font-medium leading-snug text-white shadow-lg transition-all duration-200"
                        style={{ opacity: isHovered ? 1 : 0, transform: `translateX(-50%) translateY(${isHovered ? 0 : 6}px)` }}
                      >
                        {item.title}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
