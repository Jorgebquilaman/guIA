import { create } from 'zustand'
import { generateId } from '../utils/id'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UiState {
  sidebarOpen: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  addToast: (type, message) => {
    const id = generateId()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
