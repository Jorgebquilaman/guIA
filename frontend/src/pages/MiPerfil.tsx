import { useState, useMemo, useEffect } from 'react'
import { useMyAuthorMetadata, useUpdateMyAuthorMetadata } from '../api/authorMetadata'
import { useUiStore } from '../store/uiStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import AuthorMetadataFieldsEditor from '../components/AuthorMetadataFieldsEditor'

export default function MiPerfil() {
  const { data: profile, isLoading } = useMyAuthorMetadata()
  const saveMutation = useUpdateMyAuthorMetadata()
  const addToast = useUiStore((s) => s.addToast)

  const [values, setValues] = useState<Record<string, string[]>>({})
  const [initialized, setInitialized] = useState(false)
  const [authorizes, setAuthorizes] = useState<boolean | null>(null)

  useEffect(() => {
    if (!profile || initialized) return
    const initial: Record<string, string[]> = {}
    for (const f of profile.fields) {
      initial[f.id] = f.values.length > 0 ? [...f.values] : ['']
    }
    setValues(initial)
    setAuthorizes(profile.authorizesPublication)
    setInitialized(true)
  }, [profile, initialized])

  const missingMandatory = useMemo(() => {
    if (!profile) return []
    return profile.fields
      .filter((f) => f.obligatoriness === 'Mandatory')
      .filter((f) => !(values[f.id] ?? []).some((v) => v.trim()))
      .map((f) => f.label)
  }, [profile, values])

  const handleSave = async () => {
    if (missingMandatory.length > 0) {
      addToast('error', `Completá los campos obligatorios: ${missingMandatory.join(', ')}`)
      return
    }
    const payload = Object.entries(values)
      .flatMap(([fieldId, vals]) =>
        vals.filter((v) => v.trim()).map((value, repeatIndex) => ({ fieldId, value: value.trim(), repeatIndex })),
      )
    try {
      await saveMutation.mutateAsync({ values: payload, authorizesPublication: authorizes ?? undefined })
      addToast('success', 'Perfil de autor actualizado')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al guardar el perfil')
    }
  }

  if (isLoading || !profile) {
    return <div className="flex h-full items-center justify-center p-6"><Spinner size="lg" /></div>
  }

  if (!profile.categoryId) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-xl font-bold text-iupa-dark">Mi perfil de autor</h1>
        <Card>
          <p className="p-4 text-sm text-iupa-medium">
            No tenés una categoría de acceso asignada todavía. Contactá al administrador del repositorio.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
          <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-iupa-dark">Mi perfil de autor</h1>
          <p className="text-xs text-iupa-medium">
            Categoría: <span className="font-medium text-teal-700">{profile.categoryName}</span>
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-iupa-light bg-iupa-green-light/30 px-6 py-3">
          <span className="text-sm font-semibold text-iupa-green">Datos de autor ({profile.categoryName})</span>
        </div>
        <div className="p-6">
          <AuthorMetadataFieldsEditor
            fields={profile.fields}
            values={values}
            onChange={(fieldId, vals) => setValues((prev) => ({ ...prev, [fieldId]: vals }))}
          />
          {profile.fields.length === 0 && (
            <p className="text-center text-xs text-iupa-medium">
              Tu categoría todavía no definió campos de autor.
            </p>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-iupa-light bg-iupa-light/40 px-6 py-3">
          <span className="text-sm font-semibold text-iupa-medium">Publicación de mis datos</span>
        </div>
        <div className="p-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-iupa-dark">
            <input
              type="checkbox"
              checked={authorizes ?? profile.authorizesPublication}
              onChange={(e) => setAuthorizes(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
            />
            <span className="text-xs text-iupa-medium">
              <span className="font-medium text-iupa-dark">Autorizo la publicación de mis datos en el repositorio. </span>
              {profile.consentText}
            </span>
          </label>
          {profile.dataConsentAt && (
            <p className="mt-2 text-right text-xs text-iupa-medium">
              Autorizado el {new Date(profile.dataConsentAt).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} loading={saveMutation.isPending}>
          Guardar perfil
        </Button>
      </div>
    </div>
  )
}
