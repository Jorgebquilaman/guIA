import { useState, useEffect } from 'react'
import { useSiteConfig, useUpdateSiteConfig } from '../../api/admin'
import { useUiStore } from '../../store/uiStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

export default function SiteConfig() {
  const { data: config, isLoading } = useSiteConfig()
  const updateMutation = useUpdateSiteConfig()
  const addToast = useUiStore((s) => s.addToast)

  const [showMessage, setShowMessage] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    if (config) {
      setShowMessage(config.showMessage)
      setMessageText(config.messageText)
      setBaseUrl(config.baseUrl || '')
    }
  }, [config])

  const handleSave = async () => {
    if (showMessage && !messageText.trim()) return
    try {
      await updateMutation.mutateAsync({ showMessage, messageText: messageText.trim(), baseUrl: baseUrl.trim() || null })
      addToast('success', 'Configuración del sitio guardada')
    } catch {
      addToast('error', 'Error al guardar la configuración')
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
        <h1 className="text-2xl font-bold text-iupa-dark">Configuración del Sitio</h1>
      </div>

      <Card>
        <div className="space-y-5 p-6">
          <div className="rounded-lg border border-iupa-green-light bg-iupa-green-light p-4 text-sm text-iupa-green">
            Configura el mensaje informativo que aparece en la página principal, en la barra lateral.
            Puedes habilitarlo o deshabilitarlo y editar el texto. Los cambios se aplican inmediatamente.
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showMessage}
                onChange={(e) => setShowMessage(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-iupa-green peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
            <span className="text-sm font-medium text-iupa-dark">
              Mostrar mensaje informativo
            </span>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-iupa-dark">
              Texto del mensaje
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
              placeholder="Escribe el mensaje informativo..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-iupa-dark">
              URL base del sitio (canonical)
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
              placeholder="https://repositorio.iupa.edu.ar"
            />
            <p className="mt-1 text-xs text-iupa-medium">
              Usado para sitemap.xml, meta tags de Google Scholar y canonical URL. Dejar vacío para usar la URL actual del sitio.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {showMessage && messageText.trim() && (
              <div className="flex-1 rounded-lg border border-iupa-light bg-iupa-light p-3 text-xs text-iupa-medium">
                <p className="mb-1 text-xs font-semibold text-iupa-dark">Vista previa:</p>
                <p>{messageText}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {config && (
              <Button variant="ghost" onClick={() => { setShowMessage(config.showMessage); setMessageText(config.messageText); setBaseUrl(config.baseUrl || '') }}>
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
