import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderTree, ChevronRight, FolderOpen, Folder } from 'lucide-react'
import { useI18n } from '../../i18n/context'
import type { Collection } from '../../types'

interface TreeNodeProps {
  collection: Collection
  depth: number
  onSelect: (id: string) => void
}

function TreeNode({ collection, depth, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = collection.subCollections?.length > 0

  return (
    <li>
      <div
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-iupa-dark transition-colors hover:bg-iupa-green-light"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onSelect(collection.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((p) => !p)
            }}
            className="shrink-0 text-iupa-medium hover:text-iupa-green"
          >
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
        {!hasChildren && <span className="w-3.5" />}
        {expanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-iupa-green" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-iupa-medium" />
        )}
        <span className="truncate">{collection.name}</span>
        <span className="ml-auto text-[11px] text-iupa-medium">{collection.documentCount}</span>
      </div>
      {hasChildren && expanded && (
        <ul>
          {collection.subCollections.map((child) => (
            <TreeNode key={child.id} collection={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function CollectionNavDropdown() {
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/collections')
      .then((r) => r.json())
      .then((d) => {
        setCollections(d.data ?? d ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(id: string) {
    setOpen(false)
    navigate(`/buscar?collectionId=${id}`)
  }

  const roots = collections
    .filter((c) => !c.parentCollectionId)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-lg border border-iupa-light bg-iupa-light px-3 py-1.5 text-xs text-iupa-dark transition-colors hover:bg-iupa-green-light hover:text-iupa-green"
      >
        <FolderTree className="h-3.5 w-3.5" />
        {t('nav.colecciones')}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-iupa-light bg-white shadow-xl">
          <div className="border-b border-iupa-light px-3 py-2">
            <p className="text-xs font-semibold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t('nav.explorarColeccion')}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-1.5 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-iupa-light" />
                ))}
              </div>
            ) : roots.length === 0 ? (
              <p className="p-3 text-center text-xs text-iupa-medium">{t('nav.sinColecciones')}</p>
            ) : (
              <ul className="space-y-0.5">
                {roots.map((root) => (
                  <TreeNode key={root.id} collection={root} depth={0} onSelect={handleSelect} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
