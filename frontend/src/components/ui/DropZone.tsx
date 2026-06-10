import { useState, useRef, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

function DropZone({ onFilesSelected, accept, maxSize = DEFAULT_MAX_SIZE, disabled = false }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [currentFiles, setCurrentFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      setError(null)
      const valid: File[] = []
      const arr = Array.from(fileList)

      for (const file of arr) {
        if (maxSize && file.size > maxSize) {
          setError(`File "${file.name}" exceeds the maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`)
          continue
        }
        if (accept) {
          const accepted = accept.split(',').map((a) => a.trim())
          const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
          const mimeMatch = accepted.some((a) => file.type.match(a.replace('*', '.*')))
          const extMatch = accepted.some((a) => a === ext)
          if (!mimeMatch && !extMatch) {
            setError(`File "${file.name}" does not match accepted types: ${accept}`)
            continue
          }
        }
        valid.push(file)
      }

      return valid
    },
    [accept, maxSize],
  )

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
      if (disabled) return
      const valid = validateFiles(e.dataTransfer.files)
      setCurrentFiles(valid)
      if (valid.length > 0) onFilesSelected(valid)
    },
    [disabled, validateFiles, onFilesSelected],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) return
      const valid = validateFiles(e.target.files)
      setCurrentFiles(valid)
      if (valid.length > 0) onFilesSelected(valid)
    },
    [disabled, validateFiles, onFilesSelected],
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging ? 'border-iupa-green bg-iupa-green-light' : 'border-iupa-light hover:border-iupa-green-light'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        className="hidden"
      />

      <svg className="mx-auto mb-3 h-10 w-10 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.366 3 3 0 013.138 2.596A3.75 3.75 0 0118.75 19.5H6.75z" />
      </svg>

      <p className="text-sm text-slate-600">
        <span className="font-medium text-iupa-green">Click to upload</span> or drag and drop
      </p>
      {accept && <p className="mt-1 text-xs text-iupa-medium">Accepted: {accept}</p>}
      {maxSize && (
        <p className="text-xs text-iupa-medium">Max size: {Math.round(maxSize / 1024 / 1024)}MB</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {currentFiles.length > 0 && (
        <ul className="mt-4 space-y-1 text-left">
          {currentFiles.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded bg-iupa-light px-3 py-1.5 text-sm text-iupa-dark">
              <svg className="h-4 w-4 shrink-0 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{f.name}</span>
              <span className="ml-auto shrink-0 text-xs text-iupa-medium">
                {Math.round(f.size / 1024)}KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DropZone
