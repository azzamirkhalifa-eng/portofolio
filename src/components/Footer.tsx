type FooterProps = {
  name?: string
}

export default function Footer({ name }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-10 sm:flex-row sm:py-12">
        <p className="text-sm text-muted">
          © {year} {name || 'Portfolio'}
          <span className="text-accent">.</span>
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/25">
          React · Vite · Supabase
        </p>
      </div>
    </footer>
  )
}