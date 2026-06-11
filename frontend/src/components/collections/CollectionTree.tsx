import { useState } from 'react'
import { useCollections } from '../../api/collections'
import type { Collection } from '../../types'

interface CollectionTreeProps {
  selectedCollectionId?: string
  onSelect: (collection: Collection) => void
}

function TreeNode({
  collection,
  depth,
  selectedCollectionId,
  onSelect,
}: {
  collection: Collection
  depth: number
  selectedCollectionId?: string
  onSelect: (collection: Collection) => void
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = collection.subCollections?.length > 0
  const isSelected = selectedCollectionId === collection.id

  return (
    <li>
      <div
        className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm ${
          isSelected
            ? 'bg-iupa-green text-white font-medium'
            : 'text-iupa-dark hover:bg-iupa-green-light'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(collection)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((p) => !p)
            }}
            className="shrink-0 text-iupa-medium hover:text-iupa-green"
          >
            <svg
              className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-3" />}
        <svg className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-iupa-medium'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <span className="truncate">{collection.name}</span>
        <span className="ml-auto text-xs text-iupa-medium">
          {collection.documentCount}
        </span>
      </div>
      {hasChildren && expanded && (
        <ul>
          {collection.subCollections.map((child) => (
            <TreeNode
              key={child.id}
              collection={child}
              depth={depth + 1}
              selectedCollectionId={selectedCollectionId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function CollectionTree({
  selectedCollectionId,
  onSelect,
}: CollectionTreeProps) {
  const { data: collections, isLoading, isError } = useCollections()

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-iupa-light" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">Failed to load collections</p>
    )
  }

  const roots = collections?.filter((c) => !c.parentCollectionId) ?? []

  return (
    <nav className="rounded-lg border border-iupa-light bg-iupa-white p-2">
      <ul className="space-y-0.5">
        {roots.map((root) => (
          <TreeNode
            key={root.id}
            collection={root}
            depth={0}
            selectedCollectionId={selectedCollectionId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </nav>
  )
}
