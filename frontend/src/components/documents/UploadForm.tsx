import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUploadDocument, useUploadLink } from '../../api/documents'
import { useCollections } from '../../api/collections'
import { extractGoogleDriveId, getGoogleDriveEmbedUrl } from '../../utils/gdrive'
import type { Collection } from '../../types'

type UploadTab = 'files' | 'links'

interface UploadFileEntry {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

function flattenCollections(collections: Collection[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = []
  for (const c of collections) {
    result.push({ id: c.id, name: c.name, depth })
    if (c.subCollections?.length) {
      result.push(...flattenCollections(c.subCollections, depth + 1))
    }
  }
  return result
}

function LinkForm() {
  const navigate = useNavigate()
  const [sourceUrl, setSourceUrl] = useState('')
  const [title, setTitle] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [description, setDescription] = useState('')
  const [uploadedId, setUploadedId] = useState<string | null>(null)

  useEffect(() => {
    if (uploadedId) navigate('/app', { replace: true })
  }, [uploadedId, navigate])

  const { data: collections } = useCollections()
  const flatCollections = useMemo(() => collections ? flattenCollections(collections) : [], [collections])
  const uploadMutation = useUploadLink()

  const gdriveId = extractGoogleDriveId(sourceUrl)
  const gdriveEmbedUrl = getGoogleDriveEmbedUrl(sourceUrl)

  const handleSubmit = useCallback(async () => {
    if (!sourceUrl.trim() || !title.trim() || !collectionId) return

    try {
      const result = await uploadMutation.mutateAsync({
        sourceUrl: sourceUrl.trim(),
        title: title.trim(),
        collectionId,
        isPublic,
        description: description.trim() || null,
      })
      setUploadedId(result.id ?? result.documentId)
    } catch {
      // error handled by mutation
    }
  }, [sourceUrl, title, collectionId, isPublic, description, uploadMutation])

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-iupa-dark">
          URL del enlace <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
        />
        {sourceUrl && gdriveId && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Google Drive detectado (ID: {gdriveId})
          </div>
        )}
        {sourceUrl && !gdriveId && !/^https?:\/\/.+/i.test(sourceUrl) && (
          <p className="mt-1 text-xs text-red-500">Ingresá una URL válida (https://...)</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-iupa-dark">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del documento"
            className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-iupa-dark">
            Colección <span className="text-red-500">*</span>
          </label>
          <select
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
          >
            <option value="">Seleccionar colección</option>
            {flatCollections.map((c) => (
              <option key={c.id} value={c.id}>
                {'\u00A0'.repeat(c.depth * 4)}{c.depth > 0 ? '↳ ' : ''}{c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-iupa-dark">
          Descripción (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Breve descripción del contenido del enlace..."
          className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none resize-none"
        />
      </div>

      {gdriveEmbedUrl && (
        <div>
          <p className="mb-2 text-xs font-medium text-iupa-medium">Vista previa de Google Drive</p>
          <div className="overflow-hidden rounded-lg border border-iupa-light">
            <iframe
              src={gdriveEmbedUrl}
              className="h-[300px] w-full"
              title="Vista previa de Google Drive"
              allow="autoplay"
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-iupa-dark">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded border-iupa-light text-iupa-green focus:ring-iupa-green"
        />
        Hacer visible públicamente
      </label>

      <button
        onClick={handleSubmit}
        disabled={!sourceUrl.trim() || !title.trim() || !collectionId || uploadMutation.isPending}
        className="w-full rounded-lg bg-iupa-green px-4 py-2 text-sm font-medium text-white hover:bg-iupa-green-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploadMutation.isPending ? 'Publicando...' : 'Publicar enlace'}
      </button>
    </div>
  )
}

export default function UploadForm() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<UploadTab>('files')
  const [files, setFiles] = useState<UploadFileEntry[]>([])
  const [title, setTitle] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [uploadedId, setUploadedId] = useState<string | null>(null)
  const [mediaLinks, setMediaLinks] = useState<{ url: string; label: string; type: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (uploadedId) navigate('/app', { replace: true })
  }, [uploadedId, navigate])

  const { data: collections } = useCollections()
  const flatCollections = useMemo(() => collections ? flattenCollections(collections) : [], [collections])
  const uploadMutation = useUploadDocument()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    setFiles((prev) => [
      ...prev,
      ...dropped.map((f) => ({ file: f, status: 'pending' as const })),
    ])
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => [
      ...prev,
      ...selected.map((f) => ({ file: f, status: 'pending' as const })),
    ])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addMediaLink = useCallback(() => {
    setMediaLinks((prev) => [...prev, { url: '', label: '', type: 'video' }])
  }, [])

  const updateMediaLink = useCallback((index: number, field: 'url' | 'label' | 'type', value: string) => {
    setMediaLinks((prev) => prev.map((ml, i) => (i === index ? { ...ml, [field]: value } : ml)))
  }, [])

  const removeMediaLink = useCallback((index: number) => {
    setMediaLinks((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })))

    const formData = new FormData()
    files.forEach((entry) => formData.append('files', entry.file))
    if (title.trim()) formData.append('title', title.trim())
    if (collectionId) formData.append('collectionId', collectionId)
    formData.append('isPublic', String(isPublic))
    if (coverImage) formData.append('coverImage', coverImage)
    const validLinks = mediaLinks.filter((ml) => ml.url.trim())
    if (validLinks.length > 0) {
      formData.append('mediaLinks', JSON.stringify(validLinks))
    }

    try {
      const result = await uploadMutation.mutateAsync(formData)
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' as const })))
      setUploadedId(result.id ?? result.documentId)
    } catch {
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error' as const,
          error: 'Error al subir',
        })),
      )
    }
  }, [files, title, collectionId, isPublic, coverImage, mediaLinks, uploadMutation])

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-iupa-light bg-iupa-light/50 p-1">
        <button
          onClick={() => setTab('files')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'files'
              ? 'bg-white text-iupa-dark shadow-sm'
              : 'text-iupa-medium hover:text-iupa-dark'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          ARCHIVOS
        </button>
        <button
          onClick={() => setTab('links')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'links'
              ? 'bg-white text-iupa-dark shadow-sm'
              : 'text-iupa-medium hover:text-iupa-dark'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          ENLACES
        </button>
      </div>

      {tab === 'links' ? (
        <LinkForm />
      ) : (
        <>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-iupa-light bg-iupa-light p-8 hover:border-iupa-green-light hover:bg-iupa-green-light"
            onClick={() => inputRef.current?.click()}
          >
            <svg
              className="mb-2 h-8 w-8 text-iupa-medium"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-iupa-medium">
              Arrastrá tus archivos acá, o hacé clic para seleccionar
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <ul className="divide-y divide-iupa-light rounded-lg border border-iupa-light">
              {files.map((entry, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-iupa-dark">{entry.file.name}</span>
                  <div className="flex items-center gap-2">
                    {entry.status === 'uploading' && (
                      <span className="text-iupa-green">Subiendo...</span>
                    )}
                    {entry.status === 'done' && (
                      <span className="text-emerald-500">Completado</span>
                    )}
                    {entry.status === 'error' && (
                      <span className="text-red-500">{entry.error}</span>
                    )}
                    {entry.status === 'pending' && (
                      <button
                        onClick={() => removeFile(i)}
                        className="text-iupa-medium hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-lg border border-dashed border-iupa-light bg-white p-4">
            <label className="mb-2 block text-sm font-medium text-iupa-dark">Imagen de portada (opcional)</label>
            {coverImage ? (
              <div className="flex items-center gap-3">
                <img
                  src={URL.createObjectURL(coverImage)}
                  alt="Portada"
                  className="h-16 w-12 rounded object-cover shadow-sm"
                />
                <span className="truncate text-sm text-iupa-medium">{coverImage.name}</span>
                <button
                  onClick={() => { setCoverImage(null); if (coverInputRef.current) coverInputRef.current.value = '' }}
                  className="ml-auto text-xs text-red-500 hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-iupa-light px-4 py-2 text-sm text-iupa-medium hover:bg-iupa-light transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                Elegir imagen
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="rounded-lg border border-dashed border-iupa-light bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-iupa-dark">Enlaces multimedia (opcional)</label>
              <button
                type="button"
                onClick={addMediaLink}
                className="flex items-center gap-1 text-xs text-iupa-green hover:text-iupa-green-secondary"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Agregar enlace
              </button>
            </div>
            {mediaLinks.length === 0 && (
              <p className="text-xs text-iupa-medium">Agregá enlaces a Google Drive, YouTube, Vimeo, audio, etc. relacionados con el archivo.</p>
            )}
            {mediaLinks.map((ml, i) => (
              <div key={i} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-iupa-light p-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-0.5 block text-xs text-iupa-medium">URL</label>
                  <input
                    type="url"
                    value={ml.url}
                    onChange={(e) => updateMediaLink(i, 'url', e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded border border-iupa-light px-2 py-1.5 text-sm focus:border-iupa-green focus:outline-none"
                  />
                </div>
                <div className="w-[140px]">
                  <label className="mb-0.5 block text-xs text-iupa-medium">Etiqueta</label>
                  <input
                    type="text"
                    value={ml.label}
                    onChange={(e) => updateMediaLink(i, 'label', e.target.value)}
                    placeholder="Video explicativo"
                    className="w-full rounded border border-iupa-light px-2 py-1.5 text-sm focus:border-iupa-green focus:outline-none"
                  />
                </div>
                <div className="w-[110px]">
                  <label className="mb-0.5 block text-xs text-iupa-medium">Tipo</label>
                  <select
                    value={ml.type}
                    onChange={(e) => updateMediaLink(i, 'type', e.target.value)}
                    className="w-full rounded border border-iupa-light px-2 py-1.5 text-sm focus:border-iupa-green focus:outline-none"
                  >
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="embed">Embed</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeMediaLink(i)}
                  className="mb-0.5 rounded p-1.5 text-iupa-medium hover:bg-red-50 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">
                Título (opcional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dejalo vacío para que la IA lo genere"
                className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-iupa-dark">
                Colección
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full rounded-lg border border-iupa-light px-3 py-2 text-sm focus:border-iupa-green focus:outline-none"
              >
                <option value="">Seleccionar colección</option>
                {flatCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'\u00A0'.repeat(c.depth * 4)}{c.depth > 0 ? '↳ ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-iupa-dark">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-iupa-light text-iupa-green focus:ring-iupa-green"
            />
            Hacer visible públicamente
          </label>

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || !collectionId || uploadMutation.isPending}
            className="w-full rounded-lg bg-iupa-green px-4 py-2 text-sm font-medium text-white hover:bg-iupa-green-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Subiendo...' : 'Subir'}
          </button>
        </>
      )}
    </div>
  )
}
