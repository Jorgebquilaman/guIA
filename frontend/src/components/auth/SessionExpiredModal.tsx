import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Modal from '../ui/Modal'
import Spinner from '../ui/Spinner'
import { useAuthStore } from '../../store/authStore'
import client, { SESSION_EXPIRED_EVENT, resetSessionExpired } from '../../api/client'
import type { ApiResponse, LoginResponse } from '../../types'

function SessionExpiredModal() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handler = () => {
      setPassword('')
      setError('')
      setOpen(true)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password || !user) return
    setSubmitting(true)
    setError('')
    try {
      const res = await client.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        { email: user.email ?? '', password },
      )
      if (!res.data.success || !res.data.data) {
        setError(res.data.error?.message ?? 'Credenciales inválidas')
        return
      }
      setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken, res.data.data.expiresAt)
      resetSessionExpired()
      setOpen(false)
    } catch {
      setError('No se pudo reautenticar. Verificá tu contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    resetSessionExpired()
    logout()
    navigate('/login')
  }

  return (
    <Modal open={open} onClose={() => {}} title="Sesión expirada" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">
            Tu sesión por seguridad venció. Volvé a ingresar tu contraseña para continuar donde estabas —
            <strong> no se perdió nada de lo que estabas haciendo.</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Usuario</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20"
            />
          </div>
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-iupa-green px-4 py-2.5 text-sm font-medium text-white hover:bg-iupa-green/90 disabled:opacity-50"
          >
            {submitting && <Spinner size="sm" />}
            {submitting ? 'Ingresando...' : 'Continuar sesión'}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          Cerrar sesión e ir al login
        </button>
      </div>
    </Modal>
  )
}

export default SessionExpiredModal
