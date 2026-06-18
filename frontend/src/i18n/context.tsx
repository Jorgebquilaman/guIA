import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import es from './es.json'
import en from './en.json'

export type Lang = 'es' | 'en'

type Translations = Record<string, string | Record<string, string>>

const LANG_STORAGE_KEY = 'iupa-lang'

const dictionaries: Record<Lang, Translations> = { es, en }

function getInitialLang(): Lang {
  const stored = typeof window !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null
  if (stored === 'es' || stored === 'en') return stored
  return 'es'
}

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(LANG_STORAGE_KEY, l)
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: string | Record<string, string> | undefined = dictionaries[lang]
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, string | Record<string, string>>)[k] as string | Record<string, string> | undefined
      } else {
        value = undefined
        break
      }
    }
    let result = typeof value === 'string' ? value : key
    if (vars) {
      for (const [vk, vv] of Object.entries(vars)) {
        result = result.replace(`{${vk}}`, String(vv))
      }
    }
    return result
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
