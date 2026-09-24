import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, CheckCircle, ArrowLeft } from 'lucide-react'
import { useRequestAccess } from '../../api/auth'
import { useActiveAccessCategories, } from '../../api/accessCategories'
import { useAuthorFieldsForCategory, useConsentSettings } from '../../api/authorMetadata'
import AuthorMetadataFieldsEditor from '../../components/AuthorMetadataFieldsEditor'

export default function RequestAccess() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const mutation = useRequestAccess()
  const { data: categories, isLoading: loadingCategories } = useActiveAccessCategories()
  const { data: categoryFields, isLoading: loadingFields } = useAuthorFieldsForCategory(categoryId)
  const { data: consent } = useConsentSettings()
  const [fieldValues, setFieldValues] = useState<Record<string, string[]>>({})
  const [authorizes, setAuthorizes] = useState(false)

  const missingMandatory = useMemo(() => {
    if (!categoryFields) return []
    return categoryFields
      .filter((f) => f.obligatoriness === 'Mandatory')
      .filter((f) => !(fieldValues[f.id] ?? []).some((v) => v.trim()))
      .map((f) => f.label)
  }, [categoryFields, fieldValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || !email.trim()) return
    if (!categoryId) {
      setError('Elegí la categoría que mejor describa tu vínculo con el IUPA.')
      return
    }
    if (missingMandatory.length > 0) {
      setError(`Completá los campos obligatorios: ${missingMandatory.join(', ')}`)
      return
    }
    try {
      const authorMetadata = Object.entries(fieldValues)
        .flatMap(([fieldId, vals]) =>
          vals
            .filter((v) => v.trim())
            .map((value, repeatIndex) => ({ fieldId, value: value.trim(), repeatIndex })),
        )
      await mutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        accessCategoryId: categoryId,
        authorMetadata,
        authorizesPublication: authorizes,
        consentText: authorizes ? (consent?.consentText ?? '') : '',
      })
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
                  <div>
                    <p className="mb-2 text-sm font-medium text-iupa-dark">¿Cuál es tu vínculo con el IUPA?</p>
                    {loadingCategories ? (
                      <p className="text-sm text-iupa-medium">Cargando categorías...</p>
                    ) : !categories || categories.length === 0 ? (
                      <p className="text-sm text-iupa-medium">No hay categorías disponibles por el momento.</p>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((cat) => {
                          const selected = categoryId === cat.id
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setCategoryId(cat.id)
                                setFieldValues({})
                              }}
                              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                                selected
                                  ? 'border-iupa-green bg-iupa-green-light/30 ring-1 ring-iupa-green'
                                  : 'border-iupa-light bg-white hover:border-iupa-green/50'
                              }`}
                            >
                              <span className="flex items-center gap-2 text-sm font-semibold text-iupa-dark">
                                <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${selected ? 'border-iupa-green' : 'border-iupa-light'}`}>
                                  {selected && <span className="h-2 w-2 rounded-full bg-iupa-green" />}
                                </span>
                                {cat.name}
                              </span>
                              {cat.description && (
                                <span className="mt-1 block pl-6 text-xs text-iupa-medium">{cat.description}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {categoryId && categoryFields && categoryFields.length > 0 && (
                    <div className="rounded-lg border border-iupa-light bg-iupa-light/30 p-4">
                      <p className="mb-3 text-sm font-semibold text-iupa-dark">Datos de autor</p>
                      {loadingFields ? (
                        <p className="text-sm text-iupa-medium">Cargando campos...</p>
                      ) : (
                        <AuthorMetadataFieldsEditor
                          fields={categoryFields}
                          values={fieldValues}
                          onChange={(fieldId, values) =>
                            setFieldValues((prev) => ({ ...prev, [fieldId]: values }))
                          }
                        />
                      )}
                    </div>
                  )}

                  {consent?.consentText && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-iupa-light px-4 py-3 text-sm hover:bg-iupa-green-light/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={authorizes}
                        onChange={(e) => setAuthorizes(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
                      />
                      <span className="text-xs text-iupa-medium">
                        <span className="font-medium text-iupa-dark">Autorización de publicación: </span>
                        {consent.consentText}
                      </span>
                    </label>
                  )}

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
