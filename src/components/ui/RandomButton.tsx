import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { t, ui, type UiEntry } from '../../lib/i18n'

/** Satu tujuan acak: id (kunci React) + route detail-nya. */
export type RandomTarget = {
  id: number | string
  to: string
}

type RandomButtonProps = {
  /** Daftar halaman detail yang boleh dipilih (project / cerita). */
  items: RandomTarget[]
  /** Label tombol, mis. ui.acakProject / ui.acakPerjalanan. */
  label: UiEntry
  /** Kelas tambahan untuk penempatan (margin, dll). */
  className?: string
}

/** Ikon shuffle (garis) — intuitif untuk fungsi "acak". */
function ShuffleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="M4 4l5 5" />
    </svg>
  )
}

/**
 * Tombol "Acak" (Fitur 4) — membuka satu project/cerita secara acak.
 *
 * Halaman yang sedang dibuka dihindari bila masih ada pilihan lain
 * (fallback: seluruh daftar, supaya satu-satunya item tetap bisa dibuka).
 * Tampilan pill mengikuti tab filter kategori yang sudah ada.
 */
export default function RandomButton({
  items,
  label,
  className = '',
}: RandomButtonProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { lang } = useLanguage()

  function go() {
    // Hindari route yang sedang aktif kalau masih ada alternatif lain.
    const others = items.filter((item) => item.to !== pathname)
    const pool = others.length > 0 ? others : items
    if (pool.length === 0) return
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    navigate(chosen.to)
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={items.length === 0}
      title={t(ui.acakTooltip, lang)}
      aria-label={t(label, lang)}
      className={`inline-flex shrink-0 cursor-target items-center gap-1.5 rounded-full border border-hairline px-4 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent-text disabled:cursor-not-allowed disabled:opacity-40 ${className}`.trim()}
    >
      <ShuffleIcon />
      {t(label, lang)}
    </button>
  )
}
