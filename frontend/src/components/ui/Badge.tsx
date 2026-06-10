import type { ReactNode } from 'react'

type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'archived'
type DocumentType = 'pdf' | 'image' | 'docx' | 'txt' | 'csv'
type UserRole = 'admin' | 'editor' | 'viewer'

type BadgeVariant = DocumentStatus | DocumentType | UserRole

interface BadgeProps {
  children?: ReactNode
  variant: BadgeVariant
  className?: string
}

const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  archived: { bg: 'bg-iupa-green-light', text: 'text-iupa-green', dot: 'bg-iupa-green' },
  pdf: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  image: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  docx: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  txt: { bg: 'bg-iupa-light', text: 'text-iupa-medium', dot: 'bg-iupa-medium' },
  csv: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  admin: { bg: 'bg-iupa-green-light', text: 'text-iupa-green', dot: 'bg-iupa-green' },
  editor: { bg: 'bg-dept-music/10', text: 'text-dept-music', dot: 'bg-dept-music' },
  viewer: { bg: 'bg-iupa-light', text: 'text-iupa-medium', dot: 'bg-iupa-medium' },
}

function Badge({ children, variant, className }: BadgeProps) {
  const colors = colorMap[variant] ?? { bg: 'bg-iupa-light', text: 'text-iupa-medium', dot: 'bg-iupa-medium' }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${className ?? ''}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {children ?? variant}
    </span>
  )
}

export default Badge
export type { BadgeVariant, DocumentStatus, DocumentType, UserRole }
