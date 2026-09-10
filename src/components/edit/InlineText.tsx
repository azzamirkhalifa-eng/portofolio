import { createPortal } from 'react-dom'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { useEditMode } from '../../context/EditModeContext'

/** Jeda ketik sebelum auto-save (dalam ms). */
const AUTOSAVE_DELAY = 1200
const PANEL_W = 340

type InlineTextProps = {
  value: string
  /** Simpan ke database. Lempar error kalau gagal (mis. RLS menolak). */
  onSave: (next: string) => Promise<void>
  /** true = textarea (banyak baris), false = input satu baris. */
  multiline?: boolean
  placeholder?: string
  /** Elemen yang dirender di belakang teks (mis. titik aksen "."). */
  trailing?: ReactNode
  className?: string
  ariaLabel?: string
  /** Kalau true (dan Mode Edit aktif), editor langsung terbuka sendiri. */
  autoEdit?: boolean
}

type SaveStatus = 'idle' | 'saving' | 'error'

const editorInputCls =
  'w-full rounded border border-hairline bg-background px-2.5 py-1.5 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/30'

/**
 * Teks yang bisa diedit langsung saat Mode Edit aktif.
 *
 * Cara kerja:
 * - Mode Edit mati / bukan admin -> dirender sebagai teks biasa (tanpa chrome).
 * - Mode Edit aktif -> teks diberi ring aksen; klik membuka panel editor
 *   mengambang (portal) di dekat teks.
 * - Perubahan disimpan DUA cara: auto-save ~1,2 detik setelah berhenti
 *   mengetik, ATAU tombol "Simpan" (Enter untuk satu baris, Ctrl/⌘+Enter
 *   untuk textarea). Esc / klik di luar = batal.
 * - Status selalu terlihat: "Menyimpan…", "✓ tersimpan", atau pesan error.
 */
export default function InlineText({
  value,
  onSave,
  multiline = false,
  placeholder,
  trailing,
  className = '',
  ariaLabel,
  autoEdit = false,
}: InlineTextProps) {
  const { enabled } = useEditMode()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [flashSaved, setFlashSaved] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const savingRef = useRef(false)
  const lastSavedRef = useRef(value)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  // Sinkronkan draft dengan nilai DB hanya saat tidak sedang mengedit.
  useEffect(() => {
    if (!editing) {
      setDraft(value)
      lastSavedRef.current = value
    }
  }, [value, editing])

  /** Posisi panel editor mengikuti posisi teks di layar. */
  const updatePos = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const panelH = multiline ? 220 : 140
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_W - 8))
    let top = rect.bottom + 8
    if (top + panelH > window.innerHeight - 8) {
      top = Math.max(8, rect.top - panelH - 8)
    }
    setPos({ top, left })
  }, [multiline])

  const startEditing = useCallback(() => {
    setDraft(value)
    lastSavedRef.current = value
    setStatus('idle')
    setErrorMsg('')
    setEditing(true)
    updatePos()
  }, [value, updatePos])

  // Buka editor otomatis saat autoEdit aktif (mis. habis tambah item baru).
  useEffect(() => {
    if (enabled && autoEdit && !editing) {
      startEditing()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, autoEdit])

  const stopEditing = useCallback(() => {
    setEditing(false)
    setStatus('idle')
    setErrorMsg('')
  }, [])

  /** Simpan teks; return true kalau berhasil (atau tidak ada yang berubah). */
  async function doSave(text: string): Promise<boolean> {
    if (savingRef.current) return false
    if (text === lastSavedRef.current) return true

    savingRef.current = true
    setStatus('saving')
    setErrorMsg('')
    try {
      await onSave(text)
      lastSavedRef.current = text
      setStatus('idle')
      setFlashSaved(true)
      window.setTimeout(() => setFlashSaved(false), 1800)
      return true
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menyimpan. Coba lagi.',
      )
      return false
    } finally {
      savingRef.current = false
    }
  }

  // Auto-save: jeda ketik lebih dari AUTOSAVE_DELAY.
  useEffect(() => {
    if (!editing) return
    if (draft === lastSavedRef.current) return
    const t = window.setTimeout(() => {
      void doSave(draft)
    }, AUTOSAVE_DELAY)
    return () => window.clearTimeout(t)
  }, [draft, editing])

  // Selama mengedit: pantau scroll/resize (panel ikut teks) dan
  // klik di luar panel/teks = batal.
  useEffect(() => {
    if (!editing) return

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updatePos)
    }
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      stopEditing()
    }

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('mousedown', onClickOutside)
      cancelAnimationFrame(rafRef.current)
    }
  }, [editing, updatePos, stopEditing])

  function handleKeyDown(e: ReactKeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      stopEditing()
      return
    }
    const isSaveShortcut =
      !multiline
        ? e.key === 'Enter'
        : (e.metaKey || e.ctrlKey) && e.key === 'Enter'
    if (isSaveShortcut) {
      e.preventDefault()
      void saveNow()
    }
  }

  async function saveNow() {
    const text = multiline ? draft : draft.trim()
    const ok = await doSave(text)
    if (ok) stopEditing()
  }

  // ---------- Render ----------

  // Mode non-edit (pengunjung biasa): teks polos.
  if (!enabled) {
    return (
      <span className={className}>
        {value}
        {trailing}
      </span>
    )
  }

  // Mode edit, belum mengedit: teks dengan ring aksen + ikon pensil.
  if (!editing) {
    return (
      <span
        ref={anchorRef}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel ?? 'Klik untuk mengubah teks'}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          startEditing()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            startEditing()
          }
        }}
        className={`group/edit inline-block max-w-full cursor-text rounded-[3px] ring-1 ring-inset ring-accent/30 transition hover:ring-accent/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
      >
        {value ? (
          value
        ) : (
          <span className="italic text-white/30">
            {placeholder ?? 'Klik untuk menulis…'}
          </span>
        )}
        <span
          aria-hidden
          className="ml-1.5 inline-block text-accent opacity-0 transition-opacity group-hover/edit:opacity-100"
        >
          ✎
        </span>
        {trailing}
      </span>
    )
  }

  // Mode edit, sedang mengedit: panel popover (portal) di dekat teks.
  return (
    <>
      <span
        ref={anchorRef}
        className={`inline-block max-w-full cursor-text rounded-[3px] ring-2 ring-accent/70 ${className}`}
      >
        {value ? (
          value
        ) : (
          <span className="italic text-white/30">
            {placeholder ?? 'Klik untuk menulis…'}
          </span>
        )}
        {trailing}
      </span>

      {pos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={ariaLabel ?? 'Edit teks'}
            style={{ top: pos.top, left: pos.left, width: PANEL_W }}
            className="fixed z-[98] max-w-[calc(100vw-16px)] rounded-md border border-accent/40 bg-surface p-2 shadow-2xl shadow-black/50 ring-1 ring-accent/20"
          >
            {multiline ? (
              <textarea
                autoFocus
                rows={4}
                value={draft}
                placeholder={placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${editorInputCls} min-h-24 resize-y`}
              />
            ) : (
              <input
                autoFocus
                value={draft}
                placeholder={placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                className={editorInputCls}
              />
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => void saveNow()}
                disabled={status === 'saving'}
                className="rounded bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {status === 'saving' ? 'Menyimpan…' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={stopEditing}
                className="text-xs text-muted transition-colors hover:text-foreground"
              >
                Batal
              </button>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/25">
                {multiline ? 'Ctrl/⌘+Enter' : 'Enter'} simpan · auto-simpan
              </span>

              {flashSaved && status !== 'saving' && (
                <span className="text-xs text-emerald-400">✓ tersimpan</span>
              )}
              {status === 'error' && (
                <span className="text-xs text-red-400">
                  Gagal: {errorMsg}
                </span>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
