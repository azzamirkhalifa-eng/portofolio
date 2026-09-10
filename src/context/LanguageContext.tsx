import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from '../lib/i18n'

/**
 * Preferensi bahasa tersimpan di localStorage supaya pilihan pengunjung
 * tidak hilang antar kunjungan (requirement Fitur 4 no. 3).
 */
const LANG_KEY = 'portfolio_lang'

/** Baca bahasa tersimpan; default Bahasa Indonesia. */
function readLang(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_KEY)
    return saved === 'en' ? 'en' : 'id'
  } catch {
    return 'id'
  }
}

type LanguageContextValue = {
  /** Bahasa aktif: 'id' (default) atau 'en'. */
  lang: Lang
  /** Ganti bahasa (tersimpan otomatis ke localStorage). */
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage harus dipakai di dalam <LanguageProvider>')
  }
  return ctx
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)

  const setLang = useMemo(
    () =>
      (l: Lang): void => {
        setLangState(l)
        try {
          window.localStorage.setItem(LANG_KEY, l)
        } catch {
          /* localStorage diblokir — bahasa tetap aktif untuk sesi ini */
        }
      },
    [],
  )

  // Refleksikan bahasa ke <html lang> untuk aksesibilitas/SEO.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}
