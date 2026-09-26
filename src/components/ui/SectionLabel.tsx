type SectionLabelProps = {
  /** Nomor section, misal "01" */
  index?: string
  children: string
}

/** Label section gaya Vercel: monospace kecil + garis hairline di kanan. */
export default function SectionLabel({ index, children }: SectionLabelProps) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
      {index && <span className="text-accent-text">{index}</span>}
      <span>{children}</span>
      <span className="h-px flex-1 bg-hairline" />
    </p>
  )
}