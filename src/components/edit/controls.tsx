import type { ButtonHTMLAttributes, ReactNode } from 'react'

type MiniBtnProps = {
  title: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger' | 'accent'
  children: ReactNode
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'onClick' | 'disabled' | 'className'>

const tones = {
  default:
    'border-hairline text-muted hover:border-faint/40 hover:bg-faint/5 hover:text-foreground',
  danger:
    'border-hairline text-muted hover:border-red-400/50 hover:bg-red-400/5 hover:text-red-400',
  accent: 'border-accent/40 text-accent-text hover:bg-accent/10 hover:border-accent',
}

/** Tombol ikon kecil untuk kontrol Mode Edit (panah, hapus, dll). */
export function MiniBtn({
  title,
  onClick,
  disabled = false,
  tone = 'default',
  children,
  className = '',
  ...rest
}: MiniBtnProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border bg-transparent text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Class <select> kecil untuk Mode Edit. */
export const selectCls =
  'rounded-md border border-hairline bg-surface-3 px-2 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/30'

/** Tombol ghost kecil (tambah/hapus dsb dengan label teks). */
export function GhostBtn({
  title,
  onClick,
  disabled = false,
  tone = 'default',
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
  children: ReactNode
}) {
  const toneCls =
    tone === 'danger'
      ? 'border-red-400/30 text-red-400 hover:bg-red-400/10'
      : 'border-hairline text-foreground hover:border-faint/40 hover:bg-surface-2'
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneCls}`}
    >
      {children}
    </button>
  )
}
