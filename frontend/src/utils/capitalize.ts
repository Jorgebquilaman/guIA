const MINOR_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los',
  'y', 'e', 'o', 'u', 'a', 'al', 'al',
  'en', 'con', 'por', 'para', 'sin', 'sobre',
  'un', 'una', 'unos', 'unas',
])

/**
 * Title Case para español: primera letra en mayúscula por palabra,
 * salvo artículos/preposiciones menores (no en la primera palabra).
 * Palabras que ya tienen mayúsculas internas (siglas, "BY-NC-ND") se preservan.
 */
export function toTitleCaseEs(value: string): string {
  if (!value?.trim()) return value ?? ''
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (i > 0 && MINOR_WORDS.has(lower)) return lower
      // siglas o palabras ya formateadas: no tocar
      if (/[A-ZÁÉÍÓÚÑÜ]/.test(word.slice(1))) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}
