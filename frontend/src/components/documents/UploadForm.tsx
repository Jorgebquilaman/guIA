import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUploadDocument } from '../../api/documents'
import { useCollections } from '../../api/collections'
import type { Collection } from '../../types'

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

export default function UploadForm() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<UploadFileEntry[]>([])
  const [title, setTitle] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [uploadedId, setUploadedId] = useState<string | null>(null)
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

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })))

    const formData = new FormData()
    files.forEach((entry) => formData.append('files', entry.file))
    if (title.trim()) formData.append('title', title.trim())
    if (collectionId) formData.append('collectionId', collectionId)
    formData.append('isPublic', String(isPublic))
    if (coverImage) formData.append('coverImage', coverImage)

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
  }, [files, title, collectionId, isPublic, coverImage, uploadMutation])

  return (
    <div className="space-y-4">
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
        disabled={files.length === 0 || uploadMutation.isPending}
        className="w-full rounded-lg bg-iupa-green px-4 py-2 text-sm font-medium text-white hover:bg-iupa-green-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploadMutation.isPending ? 'Subiendo...' : 'Subir'}
      </button>
    </div>
  )
}
