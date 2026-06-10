import { useEffect } from 'react'
import { useUiStore } from '../../store/uiStore'

interface ToastData {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
}

const typeStyles: Record<string, string> = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error: 'bg-red-50 border-red-500 text-red-800',
  info: 'bg-iupa-green-light border-iupa-green text-iupa-green',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
}

const typeIcons: Record<string, string> = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
}

function ToastContainer() {
  const { toasts, removeToast } = useUiStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast: ToastData) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: ToastData
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`flex w-80 items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg ${typeStyles[toast.type] || typeStyles.info}`}
    >
      <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[toast.type] || typeIcons.info} />
      </svg>
      <div className="flex-1">
        {toast.title && <p className="font-medium">{toast.title}</p>}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button onClick={onDismiss} className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default ToastContainer
