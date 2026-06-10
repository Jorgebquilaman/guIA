import { useState } from 'react'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { useForgotPassword } from '../../api/auth'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const mutation = useForgotPassword()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    await mutation.mutateAsync(email)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-iupa-light" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
        <div className="w-full rounded-xl bg-white p-8 shadow-sm">
          <a href="/login" className="mb-6 inline-flex items-center gap-1 text-sm text-iupa-green hover:text-iupa-green-secondary">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
          </a>

          {sent ? (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-iupa-green" />
              <h1 className="mb-2 text-xl font-bold text-iupa-dark">Correo enviado</h1>
              <p className="text-sm text-iupa-medium">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Mail className="h-6 w-6 text-iupa-green" />
                <h1 className="text-xl font-bold text-iupa-dark">Olvidé mi contraseña</h1>
              </div>
              <p className="mb-6 text-sm text-iupa-medium">
                Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full rounded-lg border border-iupa-light px-4 py-3 text-sm focus:border-iupa-green focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-lg bg-iupa-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-iupa-green-secondary disabled:opacity-50"
                >
                  {mutation.isPending ? 'Enviando...' : 'Enviar enlace'}
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
