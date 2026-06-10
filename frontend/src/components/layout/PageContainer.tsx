import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  title?: string
  actions?: ReactNode
}

function PageContainer({ children, title, actions }: PageContainerProps) {
  return (
    <div className="p-6">
      {(title || actions) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export default PageContainer
