import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL,
})

export const SESSION_EXPIRED_EVENT = 'guia:session-expired'

let sessionExpired = false

let refreshing: Promise<boolean> | null = null

const AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/request-access']

async function attemptRefresh(token: string): Promise<boolean> {
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: token })
    const d = res.data
    if (!d?.success || !d?.data) return false
    useAuthStore.getState().setAuth(d.data.user, d.data.accessToken, d.data.refreshToken, d.data.expiresAt)
    sessionExpired = false
    return true
  } catch {
    return false
  }
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) return false

  if (await attemptRefresh(refreshToken)) return true

  // Multi-pestaña: el refresh rota y revoca el token anterior. Otra pestaña
  // pudo haber rotado y persistido uno más nuevo: adoptarlo y reintentar una vez.
  try {
    const raw = localStorage.getItem('guia-auth')
    const persisted = raw ? JSON.parse(raw)?.state : null
    if (persisted?.refreshToken && persisted.refreshToken !== refreshToken) {
      useAuthStore.setState({
        user: persisted.user,
        accessToken: persisted.accessToken,
        refreshToken: persisted.refreshToken,
        expiresAt: persisted.expiresAt ?? null,
        isAuthenticated: true,
      })
      if (await attemptRefresh(persisted.refreshToken)) return true
    }
  } catch {
    /* localStorage ilegible: seguir sin fallback */
  }

  return false
}

// ── Refresh proactivo ──
// Renueva el access token ANTES de que expire (umbral 2 min) para que ninguna
// consulta salga con un token vencido y no aparezcan 401 en la consola.
const PROACTIVE_MARGIN_MS = 2 * 60 * 1000
function proactiveRefreshTick() {
  const { accessToken, expiresAt } = useAuthStore.getState()
  if (!accessToken || !expiresAt || refreshing) return
  const expires = new Date(expiresAt).getTime()
  if (Number.isNaN(expires)) return
  if (expires - Date.now() <= PROACTIVE_MARGIN_MS) {
    refreshing = tryRefresh().finally(() => { refreshing = null })
  }
}
if (typeof window !== 'undefined') {
  proactiveRefreshTick()
  setInterval(proactiveRefreshTick, 30_000)
}

export function resetSessionExpired() {
  sessionExpired = false
}

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const url: string = error.config?.url ?? ''

    if (status === 401 && !AUTH_URLS.some((a) => url.includes(a))) {
      if (sessionExpired) {
        return Promise.reject(error)
      }

      refreshing ??= tryRefresh().finally(() => {
        refreshing = null
      })
      const ok = await refreshing

      if (ok) {
        error.config.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`
        return client.request(error.config)
      }

      sessionExpired = true
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export default client
