import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react'
import { useChangePassword } from '../api/auth'

export default function ChangePassword() {
  const navigate = useNavigate()
  const mutation = useChangePassword()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const requirements = [
    { label: 'Al menos 8 caracteres', met: newPassword.length >= 8 },
    { label: 'Al menos 1 mayúscula', met: /[A-Z]/.test(newPassword) },
    { label: 'Al menos 1 minúscula', met: /[a-z]/.test(newPassword) },
    { label: 'Al menos 1 número', met: /\d/.test(newPassword) },
  ]
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const allMet = requirements.every((r) => r.met)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completá todos los campos')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (!allMet) {
      setError('La nueva contraseña no cumple los requisitos')
      return
    }

    try {
      await mutation.mutateAsync({ currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => navigate('/app'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <button
        onClick={() => navigate('/app')}
        className="mb-6 flex items-center gap-1.5 text-sm text-iupa-medium hover:text-iupa-green transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </button>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-iupa-green-light">
            <Lock className="h-5 w-5 text-iupa-green" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-iupa-dark">Cambiar contraseña</h2>
            <p className="text-xs text-iupa-medium">Actualizá tu clave de acceso al sistema</p>
          </div>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            Contraseña cambiada correctamente
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <X className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <ul className="mt-2 space-y-1">
                {requirements.map((req) => (
                  <li key={req.label} className={`flex items-center gap-1.5 text-xs ${req.met ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {req.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-iupa-dark">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-iupa-green focus:ring-1 focus:ring-iupa-green/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`mt-1 text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-iupa-green px-4 py-2.5 text-sm font-medium text-white hover:bg-iupa-green-secondary disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
