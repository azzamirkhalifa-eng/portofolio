import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * Tema tampilan situs. "dark" adalah default (BUKAN mengikuti preferensi
 * sistem/browser), "light" adalah pilihan tambahan.
 */
export type Theme = 'dark' | 'light'

/**
 * Preferensi tema tersimpan di localStorage supaya pilihan pengunjung
 * terakhir otomatis diterapkan saat membuka web lagi.
 * Kunci ini juga dibaca oleh script pre-paint di index.html.
 */
const THEME_KEY = 'portfolio_theme'

/** Baca tema tersimpan; default GELAP kalau belum ada pilihan. */
function readTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

type ThemeContextValue = {
  /** Tema aktif: 'dark' (default) atau 'light'. */
  theme: Theme
  /** Set tema secara eksplisit (tersimpan otomatis ke localStorage). */
  setTheme: (t: Theme) => void
  /** Balik tema aktif (dark ⇄ light). */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme harus dipakai di dalam <ThemeProvider>')
  }
  return ctx
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const transitionTimer = useRef<number | undefined>(undefined)

  // Refleksikan tema ke <html data-theme="dark|light">. Semua token warna
  // di index.css mengikuti atribut ini.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    const root = document.documentElement
    // Nyalakan transisi warna HANYA selama pergantian tema (class
    // sementara), supaya transisi/animsai lain yang sudah ada tidak
    // ikut terpengaruh.
    root.classList.add('theme-transition')
    window.clearTimeout(transitionTimer.current)
    transitionTimer.current = window.setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 400)

    setThemeState(t)
    try {
      window.localStorage.setItem(THEME_KEY, t)
    } catch {
      /* localStorage diblokir — tema tetap aktif untuk sesi ini */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  // Bersihkan timer saat provider dilepas.
  useEffect(() => () => window.clearTimeout(transitionTimer.current), [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
