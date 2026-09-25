import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  dark: boolean
  toggleDark: () => void
  setDark: (dark: boolean) => void
}

/** Preferencia de tema del usuario (persistida en el navegador) */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      setDark: (dark) => set({ dark }),
    }),
    { name: 'guia-theme' },
  ),
)
