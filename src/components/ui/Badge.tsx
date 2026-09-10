type BadgeProps = {
  children: string
}

/** Tag/badge monospace — dipakai untuk skill & teknologi project. */
export default function Badge({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center rounded-sm border border-hairline bg-surface px-2 py-0.5 font-mono text-[11px] text-muted">
      {children}
    </span>
  )
}