import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useProjects } from '../hooks/useProjects'
import { useJourneyEntries } from '../hooks/useJourneyEntries'
import { useLanguage } from '../context/LanguageContext'
import { pick, t, ui } from '../lib/i18n'

/**
 * Command palette (Ctrl/⌘ + K) — pencarian cepat ala aplikasi desktop.
 *
 * Isinya digabung dari tiga sumber:
 * - NAVIGASI: section/menu utama (sama dengan isi Navbar).
 * - PROJECT: SEMUA project dari Supabase (judulnya → halaman detail).
 * - PERJALANAN: SEMUA cerita perjalanan dari Supabase (judulnya → detail).
 *
 * Data diambil lewat hook yang sama dengan halaman publik, jadi tidak ada
 * yang di-hardcode dan perubahan admin langsung ikut (realtime).
 *
 * Keyboard: Ctrl/⌘+K buka-tutup, ↑/↓ pilih, Enter buka, Esc tutup.
 * Filter teks (case-insensitive, cocok sebagian kata) ditangani cmdk.
 */

/** Satu baris hasil di palette. */
type PaletteItem = {
  /** Kunci unik untuk React + `value` cmdk. */
  id: string
  label: string
  /** Teks kecil di kanan baris (tags project / tahun cerita). */
  hint?: string
  /** Route tujuan saat dipilih. */
  to: string
}

/** Menu utama — sengaja sama dengan Navbar supaya konsisten. */
const NAV_ITEMS: { key: string; to: string }[] = [
  { key: 'beranda', to: '/' },
  { key: 'about', to: '/#about' },
  { key: 'pencapaian', to: '/achievements' },
  { key: 'perjalanan', to: '/perjalanan' },
  { key: 'projects', to: '/projects' },
  { key: 'contact', to: '/#contact' },
]

/** Judul kelompok kategori — font mono, huruf kapital, huruf jarang. */
function GroupHeading({ children }: { children: string }) {
  return (
    <span className="block px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint/35">
      {children}
    </span>
  )
}

function Item({
  item,
  onSelect,
}: {
  item: PaletteItem
  onSelect: (to: string) => void
}) {
  return (
    <Command.Item
      value={`${item.label} ${item.hint ?? ''} ${item.id}`}
      onSelect={() => onSelect(item.to)}
      className="group flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors data-[selected=true]:bg-accent-subtle data-[selected=true]:text-foreground"
    >
      <span className="truncate">{item.label}</span>
      <span className="flex shrink-0 items-center gap-2">
        {item.hint && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint/30">
            {item.hint}
          </span>
        )}
        <span
          aria-hidden
          className="text-accent-text opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
        >
          →
        </span>
      </span>
    </Command.Item>
  )
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { projects } = useProjects()
  const { entries } = useJourneyEntries()

  /* Ctrl+K / ⌘K — pasang sekali di window. Esc ditangani di sini juga
     karena <Command> tanpa Dialog tidak menutup dirinya sendiri.
     Tidak ada shortcut lain di project ini yang memakai Ctrl/⌘+K. */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  /* Saat palette terbuka: kunci scroll halaman di belakangnya. */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const navItems = useMemo<PaletteItem[]>(
    () =>
      NAV_ITEMS.map((item) => ({
        id: `nav-${item.key}`,
        label: t(ui[item.key], lang),
        to: item.to,
      })),
    [lang],
  )

  const projectItems = useMemo<PaletteItem[]>(
    () =>
      projects.flatMap((p) =>
        p.slug
          ? [
              {
                id: `project-${p.id}`,
                label: pick(p.title, p.title_en, lang) || p.slug,
                hint: (p.tags ?? []).slice(0, 2).join(' · '),
                to: `/projects/${p.slug}`,
              },
            ]
          : [],
      ),
    [projects, lang],
  )

  const journeyItems = useMemo<PaletteItem[]>(
    () =>
      entries.flatMap((e) =>
        e.slug
          ? [
              {
                id: `journey-${e.id}`,
                label: pick(e.title, e.title_en, lang) || e.slug,
                hint: (e.entry_date ?? '').slice(0, 4),
                to: `/perjalanan/${e.slug}`,
              },
            ]
          : [],
      ),
    [entries, lang],
  )

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t(ui.commandPaletteLabel, lang)}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-xl border border-hairline bg-surface/95 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md"
          >
            <Command
              label={t(ui.commandPaletteLabel, lang)}
              className="text-foreground"
              onKeyDown={(e) => {
                /* Esc & panah sudah ditangani di sini — jangan biarkan
                   merambat ke listener global lain (mis. lightbox galeri). */
                if (e.key === 'Escape') e.stopPropagation()
              }}
            >
              <div className="flex items-center gap-3 border-b border-hairline px-4">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-4 w-4 shrink-0 text-muted"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <Command.Input
                  autoFocus
                  placeholder={t(ui.commandPalettePlaceholder, lang)}
                  className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint/35"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-faint/25 hover:text-foreground"
                >
                  Esc
                </button>
              </div>

              {/* min-h selalu punya tinggi supaya panel tidak "melompat"
                  saat hasil kosong. */}
              <Command.List className="max-h-[min(60vh,26rem)] min-h-[8rem] overflow-y-auto overscroll-contain p-2">
                <Command.Empty className="px-3 py-10 text-center text-sm text-muted">
                  {t(ui.commandPaletteEmpty, lang)}
                </Command.Empty>

                <Command.Group
                  heading={
                    <GroupHeading>{t(ui.kategoriNavigasi, lang)}</GroupHeading>
                  }
                >
                  {navItems.map((item) => (
                    <Item key={item.id} item={item} onSelect={go} />
                  ))}
                </Command.Group>

                {projectItems.length > 0 && (
                  <Command.Group
                    heading={
                      <GroupHeading>{t(ui.kategoriProject, lang)}</GroupHeading>
                    }
                  >
                    {projectItems.map((item) => (
                      <Item key={item.id} item={item} onSelect={go} />
                    ))}
                  </Command.Group>
                )}

                {journeyItems.length > 0 && (
                  <Command.Group
                    heading={
                      <GroupHeading>
                        {t(ui.kategoriPerjalanan, lang)}
                      </GroupHeading>
                    }
                  >
                    {journeyItems.map((item) => (
                      <Item key={item.id} item={item} onSelect={go} />
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              <div className="flex items-center justify-between border-t border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-faint/30">
                <span>{t(ui.commandPaletteHint, lang)}</span>
                <span aria-hidden>Ctrl K</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
