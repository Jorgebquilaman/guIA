import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, CheckCircle, ArrowLeft } from 'lucide-react'
import { useRequestAccess } from '../../api/auth'

export default function RequestAccess() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const mutation = useRequestAccess()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || !email.trim()) return
    try {
      await mutation.mutateAsync({ fullName: fullName.trim(), email: email.trim() })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar acceso')
    }
  }

  return (
    <div className="min-h-screen bg-iupa-light" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-16">
        <div className="w-full">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <button onClick={() => navigate('/login')} className="mb-6 inline-flex items-center gap-1 text-sm text-iupa-green hover:text-iupa-green-secondary">
              <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
            </button>

            {done ? (
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-iupa-green" />
                <h1 className="mb-2 text-xl font-bold text-iupa-dark">Solicitud enviada</h1>
                <p className="text-sm text-iupa-medium">
                  Tu solicitud de acceso fue enviada. Un administrador la revisará y te llegará un correo cuando sea aprobada.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <UserPlus className="h-6 w-6 text-iupa-green" />
                  <h1 className="text-xl font-bold text-iupa-dark">Solicitar acceso</h1>
                </div>
                <p className="mb-6 text-sm text-iupa-medium">
                  Completá tus datos para solicitar acceso al Repositorio Institucional del IUPA.
                  Un administrador revisará tu solicitud.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre completo" required
                    className="w-full rounded-lg border border-iupa-light px-4 py-3 text-sm focus:border-iupa-green focus:outline-none" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico" required
                    className="w-full rounded-lg border border-iupa-light px-4 py-3 text-sm focus:border-iupa-green focus:outline-none" />
                  {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                  <button type="submit" disabled={mutation.isPending}
                    className="w-full rounded-lg bg-iupa-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-iupa-green-secondary disabled:opacity-50">
                    {mutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
