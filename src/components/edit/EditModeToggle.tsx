import { Link } from 'react-router-dom'

type EditModeToggleProps = {
  enabled: boolean
  onToggle: () => void
}

/**
 * Tombol floating Mode Edit — hanya dirender untuk admin yang sudah login
 * (lihat EditModeProvider). `data-edit-nav` membebaskan link ini dari
 * pemblokiran navigasi saat mode edit aktif.
 */
export default function EditModeToggle({
  enabled,
  onToggle,
}: EditModeToggleProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex items-center gap-2">
      <Link
        to="/admin/dashboard"
        data-edit-nav
        className="hidden items-center gap-1.5 rounded-md border border-hairline bg-background/90 px-3.5 py-2 text-xs text-muted backdrop-blur transition-colors hover:border-faint/25 hover:text-foreground sm:inline-flex"
      >
        Dashboard ↗
      </Link>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-lg shadow-black/30 transition-colors ${
          enabled
            ? 'bg-accent text-white hover:bg-accent-hover'
            : 'border border-hairline bg-background/90 text-foreground backdrop-blur hover:border-faint/30'
        }`}
      >
        <svg
          aria-hidden
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
        {enabled ? 'Selesai Edit' : 'Mode Edit'}
      </button>
    </div>
  )
}
