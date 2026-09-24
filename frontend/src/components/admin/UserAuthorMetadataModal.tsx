import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import {
  useUserAuthorMetadata, useUpdateUserAuthorMetadata, type AuthorMetadataInput,
} from '../../api/authorMetadata'
import AuthorMetadataFieldsEditor from '../AuthorMetadataFieldsEditor'
import { useUiStore } from '../../store/uiStore'

interface Props {
  userId: string | null
  onClose: () => void
}

export default function UserAuthorMetadataModal({ userId, onClose }: Props) {
  const { data: profile, isLoading } = useUserAuthorMetadata(userId)
  const saveMutation = useUpdateUserAuthorMetadata()
  const addToast = useUiStore((s) => s.addToast)

  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<Record<string, string[]>>({})
  const [initializedFor, setInitializedFor] = useState<string | null>(null)

  useEffect(() => {
    setEditing(false)
    setInitializedFor(null)
  }, [userId])

  if (profile && profile.userId !== initializedFor) {
    const initial: Record<string, string[]> = {}
    for (const f of profile.fields) {
      initial[f.id] = f.values.length > 0 ? [...f.values] : ['']
    }
    setValues(initial)
    setInitializedFor(profile.userId)
  }

  const handleSave = async () => {
    const payload: AuthorMetadataInput[] = Object.entries(values)
      .flatMap(([fieldId, vals]) =>
        vals.filter((v) => v.trim()).map((value, repeatIndex) => ({ fieldId, value: value.trim(), repeatIndex })),
      )
    if (!userId) return
    try {
      await saveMutation.mutateAsync({ userId, values: payload })
      addToast('success', 'Metadatos de autor actualizados')
      setEditing(false)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <Modal open={userId !== null} onClose={onClose} title="Perfil de autor" size="lg">
      {isLoading || !profile ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg bg-iupa-green-light/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-iupa-dark">{profile.fullName}</p>
              <p className="text-xs text-iupa-medium">{profile.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-teal-700">{profile.categoryName ?? 'Sin categoría'}</p>
              <p className="text-xs text-iupa-medium">
                {profile.authorizesPublication ? 'Autoriza publicación ✓' : 'Sin autorización'}
              </p>
            </div>
          </div>

          {profile.fields.length === 0 ? (
            <p className="py-6 text-center text-sm text-iupa-medium">Sin campos de autor definidos para su categoría.</p>
          ) : editing ? (
            <div className="space-y-5">
              <AuthorMetadataFieldsEditor
                fields={profile.fields}
                values={values}
                onChange={(fieldId, vals) => setValues((prev) => ({ ...prev, [fieldId]: vals }))}
              />
              <div className="flex justify-end gap-2 border-t border-iupa-light pt-4">
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave} loading={saveMutation.isPending}>Guardar</Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-iupa-light">
              {profile.fields.map((f) => {
                const vals = f.values.filter((v) => v.trim())
                return (
                  <div key={f.id} className="grid grid-cols-[180px_1fr] gap-3 px-1 py-2.5 text-sm">
                    <span className="text-iupa-medium">{f.label}</span>
                    <span className={vals.length === 0 ? 'text-iupa-light' : 'text-iupa-dark'}>
                      {vals.length > 0 ? vals.join(' ; ') : '—'}
                    </span>
                  </div>
                )
              })}
              <div className="flex justify-end pt-4">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Editar valores</Button>
              </div>
            </div>
          )}

          {profile.dataConsentAt && (
            <p className="rounded-lg bg-iupa-light/40 px-3 py-2 text-xs text-iupa-medium">
              Autorizó la publicación de sus datos el {new Date(profile.dataConsentAt).toLocaleDateString('es-AR')}.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
