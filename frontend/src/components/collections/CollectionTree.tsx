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
            ? 'bg-iupa-green-light text-iupa-green font-medium'
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
