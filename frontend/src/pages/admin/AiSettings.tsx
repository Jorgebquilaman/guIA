import { useState, useEffect } from 'react'
import { useAiSettings, useUpdateAiSettings } from '../../api/admin'
import { useUiStore } from '../../store/uiStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'

export default function AiSettings() {
  const { data: settings, isLoading } = useAiSettings()
  const updateMutation = useUpdateAiSettings()
  const addToast = useUiStore((s) => s.addToast)

  const [apiUrl, setApiUrl] = useState('https://api.deepseek.com/v1/chat/completions')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('deepseek-chat')
  const [maxTokens, setMaxTokens] = useState(4096)

  useEffect(() => {
    if (settings) {
      setApiUrl(settings.apiUrl)
      setApiKey(settings.apiKey)
      setModel(settings.model)
      setMaxTokens(settings.maxTokens)
    }
  }, [settings])

  const handleSave = async () => {
    if (!apiUrl.trim() || !apiKey.trim() || !model.trim()) return
    try {
      await updateMutation.mutateAsync({ apiUrl: apiUrl.trim(), apiKey: apiKey.trim(), model: model.trim(), maxTokens })
      addToast('success', 'Configuración de IA guardada')
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
        <h1 className="text-2xl font-bold text-iupa-dark">Configuración de IA</h1>
      </div>

      <Card>
        <div className="space-y-5 p-6">
          <div className="rounded-lg border border-iupa-green-light bg-iupa-green-light p-4 text-sm text-iupa-green">
            Configura el proveedor de IA para el catalogado automático de documentos.
            Los cambios se aplican inmediatamente.
          </div>

          <Input
            label="URL de la API"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.deepseek.com/v1/chat/completions"
          />

          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-deep-..."
          />

          <Input
            label="Modelo"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-chat"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-iupa-dark">Máximo de tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
              min={256}
              max={65536}
              className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {settings && (
              <Button variant="ghost" onClick={() => { setApiUrl(settings.apiUrl); setApiKey(settings.apiKey); setModel(settings.model); setMaxTokens(settings.maxTokens); }}>
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
