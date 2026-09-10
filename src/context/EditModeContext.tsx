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
import { useLocation } from 'react-router-dom'
import { getSession, onAuthStateChange } from '../lib/auth'
import { isAdminEmail } from '../lib/admin'
import EditModeToggle from '../components/edit/EditModeToggle'
import ToastStack, {
  type ToastItem,
  type ToastStatus,
} from '../components/edit/ToastStack'

type EditModeContextValue = {
  /** Status login admin masih dicek (belum tahu login/belum). */
  checking: boolean
  /** Benar kalau session aktif dan email-nya = email admin. */
  isAdmin: boolean
  /** Mode Edit aktif/tidak. Hanya bermakna kalau isAdmin. */
  enabled: boolean
  setEnabled: (v: boolean) => void
  toast: (status: ToastStatus, message: string) => void
}

const EditModeContext = createContext<EditModeContextValue | null>(null)

export function useEditMode(): EditModeContextValue {
  const ctx = useContext(EditModeContext)
  if (!ctx) {
    throw new Error('useEditMode harus dipakai di dalam <EditModeProvider>')
  }
  return ctx
}

/**
 * Provider Mode Edit:
 * - memantau session (login/logout) dan menentukan isAdmin,
 * - menyimpan status on/off Mode Edit,
 * - notifikasi toast (berhasil/gagal),
 * - saat mode edit aktif, blokir navigasi link supaya klik elemen
 *   tidak melompat/scroll — ini murni UX; keamanan tulis tetap di RLS.
 */
export function EditModeProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [enabled, setEnabledState] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const isAdmin = useMemo(() => isAdminEmail(email), [email])

  // Pantau status login admin.
  useEffect(() => {
    let active = true
    void getSession().then(({ data }) => {
      if (!active) return
      setEmail(data.session?.user?.email ?? null)
      setChecking(false)
    })

    const { data: sub } = onAuthStateChange((_event, session) => {
      if (!active) return
      setEmail(session?.user?.email ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Kalau session hilang/logout, matikan Mode Edit.
  useEffect(() => {
    if (!checking && !isAdmin && enabled) {
      setEnabledState(false)
    }
  }, [checking, isAdmin, enabled])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (status: ToastStatus, message: string) => {
      idRef.current += 1
      const id = idRef.current
      setToasts((prev) => [...prev.slice(-3), { id, status, message }])
      window.setTimeout(
        () => dismissToast(id),
        status === 'error' ? 5000 : 3200,
      )
    },
    [dismissToast],
  )

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
  }, [])

  // Saat Mode Edit aktif: blokir navigasi semua <a> kecuali yang
  // bertanda data-edit-nav, supaya klik elemen tidak scroll/melompat.
  useEffect(() => {
    if (!enabled) return

    function onClickCapture(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest('a')
      if (!el) return
      if (el.hasAttribute('data-edit-nav')) return
      e.preventDefault()
    }

    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [enabled])

  const value = useMemo(
    () => ({ checking, isAdmin, enabled, setEnabled, toast }),
    [checking, isAdmin, enabled, setEnabled, toast],
  )

  return (
    <EditModeContext.Provider value={value}>
      {children}

      {/* Tombol Mode Edit hanya untuk halaman publik — di /admin sudah
          ada dashboard, jadi toggle disembunyikan di sana. */}
      {!checking && isAdmin && !location.pathname.startsWith('/admin') && (
        <EditModeToggle
          enabled={enabled}
          onToggle={() => {
            const next = !enabled
            setEnabled(next)
            if (next) {
              toast(
                'info',
                'Mode Edit aktif — klik teks/foto untuk mengubah. Perubahan tersimpan otomatis.',
              )
            }
          }}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </EditModeContext.Provider>
  )
}
