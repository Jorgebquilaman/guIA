import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar documentos...',
}: SearchBarProps) {
  const [input, setInput] = useState(value)
  const debouncedInput = useDebounce(input, 300)

  useEffect(() => {
    if (debouncedInput !== value) {
      onChange(debouncedInput)
    }
  }, [debouncedInput, onChange, value])

  useEffect(() => {
    setInput(value)
  }, [value])

  return (
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-iupa-medium"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-iupa-light py-2 pl-11 pr-8 text-sm shadow-sm focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
      />
      {input && (
        <button
          onClick={() => {
            setInput('')
            onChange('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-iupa-medium hover:text-iupa-green"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
