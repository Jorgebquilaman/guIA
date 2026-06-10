import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  className?: string
}

function Card({ children, title, className }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className ?? ''}`}>
      {title && (
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

export default Card
