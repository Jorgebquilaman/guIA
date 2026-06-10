import { useCollection } from '../../api/collections'

interface CollectionBreadcrumbProps {
  collectionId: string
}

function BreadcrumbSegment({
  collectionId,
  isLast,
}: {
  collectionId: string
  isLast: boolean
}) {
  const { data: collection } = useCollection(collectionId)

  return (
    <>
      {collection?.parentCollectionId && (
        <BreadcrumbSegment
          collectionId={collection.parentCollectionId}
          isLast={false}
        />
      )}
      <span className="flex items-center gap-1">
        {!isLast && (
          <svg className="h-3 w-3 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
        {collection && (
          <span className={`text-sm ${isLast ? 'font-medium text-iupa-dark' : 'text-iupa-medium'}`}>
            {collection.name}
          </span>
        )}
      </span>
    </>
  )
}

export default function CollectionBreadcrumb({
  collectionId,
}: CollectionBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <svg className="h-3.5 w-3.5 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
      <span className="text-iupa-medium">/</span>
      <BreadcrumbSegment collectionId={collectionId} isLast />
    </nav>
  )
}
