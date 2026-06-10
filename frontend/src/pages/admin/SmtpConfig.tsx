import { useState, useEffect } from 'react'
import { useSmtpConfig, useUpdateSmtpConfig } from '../../api/admin'
import { useUiStore } from '../../store/uiStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

export default function SmtpConfigPage() {
  const { data: config, isLoading } = useSmtpConfig()
  const updateMutation = useUpdateSmtpConfig()
  const addToast = useUiStore((s) => s.addToast)

  const [host, setHost] = useState('smtp.gmail.com')
  const [port, setPort] = useState(587)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [useSsl, setUseSsl] = useState(true)

  useEffect(() => {
    if (config) {
      setHost(config.host)
      setPort(config.port)
      setUsername(config.username)
      setPassword(config.password)
      setFromEmail(config.fromEmail)
      setFromName(config.fromName)
      setUseSsl(config.useSsl)
    }
  }, [config])

  const handleSave = async () => {
    if (!host.trim() || !username.trim() || !fromEmail.trim()) return
    try {
      await updateMutation.mutateAsync({ host: host.trim(), port, username: username.trim(), password: password.trim(), fromEmail: fromEmail.trim(), fromName: fromName.trim(), useSsl })
      addToast('success', 'Configuración SMTP guardada')
    } catch {
      addToast('error', 'Error al guardar la configuración SMTP')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-iupa-dark">Configuración SMTP</h1>
      </div>

      <Card>
        <div className="space-y-5 p-6">
          <div className="rounded-lg border border-iupa-green-light bg-iupa-green-light p-4 text-sm text-iupa-green">
            Configura el servidor SMTP para el envío de correos electrónicos (restablecimiento de contraseña, notificaciones, etc.).
            Para Gmail usá <strong>smtp.gmail.com</strong> puerto <strong>587</strong> con TLS.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">Servidor SMTP</label>
              <input value={host} onChange={(e) => setHost(e.target.value)} className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">Puerto</label>
              <input type="number" value={port} onChange={(e) => setPort(parseInt(e.target.value) || 587)} className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">Usuario</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" placeholder="tu@correo.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" placeholder="••••••••" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">Correo remitente</label>
              <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" placeholder="noreply@iupa.edu.ar" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">Nombre remitente</label>
              <input value={fromName} onChange={(e) => setFromName(e.target.value)} className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none" placeholder="GuIA IUPA" />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={useSsl} onChange={(e) => setUseSsl(e.target.checked)} className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20" />
            <span className="text-sm font-medium text-iupa-dark">Usar SSL/TLS</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            {config && (
              <Button variant="ghost" onClick={() => { setHost(config.host); setPort(config.port); setUsername(config.username); setPassword(config.password); setFromEmail(config.fromEmail); setFromName(config.fromName); setUseSsl(config.useSsl) }}>
                Restaurar
              </Button>
            )}
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              Guardar configuración
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
