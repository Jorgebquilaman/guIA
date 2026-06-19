import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '../api/client'
import type { User, ApiResponse } from '../types'

try {
  const raw = localStorage.getItem('guia-auth')
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed?.state?.user && typeof parsed.state.user.role === 'number') {
      localStorage.removeItem('guia-auth')
    }
  }
} catch {}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  logout: () => void
  updateUser: (user: User) => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      clearAuth: () => {
        localStorage.removeItem('guia-auth')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      logout: () => {
        localStorage.removeItem('guia-auth')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      updateUser: (user) => set({ user }),
      fetchUser: async () => {
        const { accessToken } = get()
        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }
        set({ isLoading: true })
        try {
          const { data } = await apiClient.get<ApiResponse<User>>('/auth/me')
          if (data.success && data.data) {
            set({ user: data.data, isAuthenticated: true })
          }
        } catch {
          set({ isAuthenticated: false, user: null })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'guia-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
