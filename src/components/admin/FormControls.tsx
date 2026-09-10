import type { ReactNode } from 'react'

/** Class input standar untuk semua form admin (dark, hairline, focus accent). */
export const inputCls =
  'w-full rounded-md border border-hairline bg-surface-3 px-3 py-2 text-sm text-foreground placeholder:text-white/45 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40'

/** Class label monospace kecil di atas tiap field. */
export const labelCls =
  'mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}

/**
 * Feedback hasil simpan/gagal — dipakai semua section admin.
 * Hijau halus = sukses, merah halus = error.
 */
export function Feedback({
  status,
  message,
}: {
  status: 'success' | 'error' | null
  message: string | null
}) {
  if (!status || !message) return null
  const isError = status === 'error'

  return (
    <p
      role="status"
      className={`rounded-md border px-3 py-2 text-sm ${
        isError
          ? 'border-red-400/30 bg-red-400/5 text-red-400'
          : 'border-emerald-400/30 bg-emerald-400/5 text-emerald-400'
      }`}
    >
      {message}
    </p>
  )
}