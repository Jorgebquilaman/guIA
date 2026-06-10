import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock, CheckCircle } from 'lucide-react'
import { useResetPassword } from '../../api/auth'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const mutation = useResetPassword()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    try {
      await mutation.mutateAsync({ token, newPassword: password })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-iupa-light" style={{ fontFamily: 'Inter, sans-serif' }}>
        <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
          <div className="w-full rounded-xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-iupa-dark">Enlace inválido</h1>
            <p className="mt-2 text-sm text-iupa-medium">Este enlace no es válido o ya expiró.</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-iupa-light" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
        <div className="w-full rounded-xl bg-white p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-iupa-green" />
              <h1 className="mb-2 text-xl font-bold text-iupa-dark">Contraseña restablecida</h1>
              <p className="mb-6 text-sm text-iupa-medium">Tu contraseña se actualizó correctamente.</p>
              <a href="/login" className="inline-flex items-center gap-2 rounded-lg bg-iupa-green px-6 py-2.5 text-sm font-bold text-white hover:bg-iupa-green-secondary">
                Iniciar sesión
              </a>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Lock className="h-6 w-6 text-iupa-green" />
                <h1 className="text-xl font-bold text-iupa-dark">Nueva contraseña</h1>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" required minLength={6}
                  className="w-full rounded-lg border border-iupa-light px-4 py-3 text-sm focus:border-iupa-green focus:outline-none" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar contraseña" required
                  className="w-full rounded-lg border border-iupa-light px-4 py-3 text-sm focus:border-iupa-green focus:outline-none" />
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                <button type="submit" disabled={mutation.isPending}
                  className="w-full rounded-lg bg-iupa-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-iupa-green-secondary disabled:opacity-50">
                  {mutation.isPending ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
