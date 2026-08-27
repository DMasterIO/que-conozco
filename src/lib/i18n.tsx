import { useState } from 'react'
import type { ReactNode } from 'react'
import { detectLang, messages, STORAGE_KEY, type Lang } from './translations'
import { I18nContext } from './i18n-context'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'es' || saved === 'en') return saved
    }
    return detectLang()
  })

  const setLang = (next: Lang) => {
    setLangState(next)
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next)
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    let str = messages[lang][key] ?? messages.es[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v))
      }
    }
    return str
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}
