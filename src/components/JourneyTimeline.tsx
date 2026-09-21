import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SmoothImage from './ui/SmoothImage'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import { formatEntryDate, t, ui } from '../lib/i18n'
import type { JourneyCategory, JourneyEntry } from '../types'

/** Titik bulat di garis timeline — berdenyut halus pada entry TERBARU. */
function TimelineNode({ pulse }: { pulse: boolean }) {
  return (
    <span className="absolute top-1.5 left-0 z-10 lg:left-1/2 lg:-translate-x-1/2">
      <span
        className={`block h-3.5 w-3.5 rounded-full border-2 ${
          pulse
            ? 'border-accent bg-accent shadow-[0_0_0_4px_var(--color-accent-subtle)]'
            : 'border-accent/60 bg-background'
        }`}
      />
      {pulse && (
        <span
          aria-hidden
          className="absolute inset-0 -m-1.5 animate-ping rounded-full border border-accent/50"
        />
      )}
    </span>
  )
}

/**
 * Satu baris entry timeline. Zigzag: desktop konten selang-seling kiri/
 * kanan garis tengah; layar sempit (<lg) garis pindah ke kiri dan semua
 * konten di kanan garis. Seluruh kartu = Link ke halaman detail
 * (/perjalanan/:slug) — link dimatikan saat Mode Edit supaya tidak
 * "lari" saat sedang mengedit (pola sama dengan kartu Achievements).
 */
function TimelineItem({
  entry,
  side,
  categoryName,
  isLatest,
}: {
  entry: JourneyEntry
  side: 'left' | 'right'
  categoryName?: string
  isLatest: boolean
}) {
  const { enabled: editMode } = useEditMode()
  const { lang } = useLanguage()
  // Thumbnail kartu = FOTO UTAMA (kolom hero_image, terpisah dari
  // galeri — pola image_url vs gallery di project). Fallback data
  // lama yang belum dimigrasi: foto pertama galeri.
  const thumbnail = entry.hero_image || entry.gallery_images?.[0] || ''
  const detailTo = !editMode && entry.slug ? `/perjalanan/${entry.slug}` : null

  const card = (
    <>
      {isLatest && (
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-subtle px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
          <span aria-hidden className="text-[8px]">●</span>
          {t(ui.kamuDiSini, lang)}
        </span>
      )}
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        {formatEntryDate(entry.entry_date, lang)}
        {categoryName && (
          <span className="ml-2 rounded-full border border-hairline px-2 py-0.5 text-[10px] text-muted">
            {categoryName}
          </span>
        )}
      </p>
      <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent">
        {entry.title || 'Tanpa judul'}
      </h3>
      {entry.excerpt && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{entry.excerpt}</p>
      )}
      {thumbnail && (
        <div className="zoom-hover mt-4 overflow-hidden rounded-lg border border-hairline">
          <SmoothImage
            src={thumbnail}
            alt={entry.title || 'Galeri cerita'}
            sizes="(min-width:1024px) 40vw, (min-width:640px) 60vw, 85vw"
            className="block h-auto w-full"
          />
        </div>
      )}
    </>
  )

  const cardCls =
    'reveal group block w-full rounded-xl border border-hairline bg-surface p-5 text-left transition-colors hover:border-white/25'

  return (
    <li className="relative lg:grid lg:grid-cols-2">
      <TimelineNode pulse={isLatest} />

      {/* Kartu — mobile: margin kiri untuk garis; desktop: kolom sesuai sisi */}
      <div
        className={`pl-10 lg:row-start-1 ${
          side === 'left' ? 'lg:col-start-1 lg:pr-12' : 'lg:col-start-2 lg:pl-12'
        }`}
      >
        {detailTo ? (
          <Link
            to={detailTo}
            data-edit-nav
            aria-label={entry.title || 'Detail cerita'}
            className={cardCls}
          >
            {card}
          </Link>
        ) : (
          <div className={cardCls}>{card}</div>
        )}
      </div>
    </li>
  )
}

type JourneyTimelineProps = {
  entries: JourneyEntry[]
  categories: JourneyCategory[]
  loading: boolean
  /** true = sedang menampilkan data contoh (DB belum diisi). */
  isDummy: boolean
}

/**
 * Timeline vertikal "Perjalanan" — garis di TENGAH (desktop), konten
 * zigzag kiri/kanan bergantian, urutan kronologis maju (lama → baru,
 * dibaca dari atas ke bawah). Filter kategori di atas (pola yang sama
 * dengan Projects/Achievements) dengan transisi fade saat filter
 * berubah, fade-up scroll-reveal per kartu (class .reveal global), dan
 * badge "Kamu di sini sekarang" pada entry paling baru.
 */
export default function JourneyTimeline({
  entries,
  categories,
  loading,
  isDummy,
}: JourneyTimelineProps) {
  const { lang } = useLanguage()
  const [filter, setFilter] = useState<number | 'all'>('all')

  // Tab filter = kategori yang benar-benar dipakai cerita (urutan position)
  const usedIds = new Set(
    entries.map((e) => e.category_id).filter((v): v is number => v !== null),
  )
  const tabs = categories.filter((c) => usedIds.has(c.id))
  const filtered = useMemo(
    () =>
      filter === 'all' ? entries : entries.filter((e) => e.category_id === filter),
    [entries, filter],
  )

  if (loading) {
    return (
      <div className="mt-10 space-y-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3.5 w-3.5 rounded-full bg-surface-2 lg:mx-auto" />
            <div
              className={`mt-4 h-28 rounded-xl border border-hairline bg-surface-2 ${
                i % 2 === 0 ? 'lg:mr-[52%]' : 'lg:ml-[52%]'
              } ml-10`}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-10">
      {/* Tab filter kategori — pola sama dengan Projects/Achievements */}
      {tabs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
              filter === 'all'
                ? 'border-accent bg-accent text-white'
                : 'border-hairline text-muted hover:border-white/25 hover:text-foreground'
            }`}
          >
            {t(ui.semua, lang)}
          </button>
          {tabs.map((cat) => {
            const active = filter === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(active ? 'all' : cat.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-hairline text-muted hover:border-white/25 hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {isDummy && (
        <p className="mt-4 rounded-lg border border-hairline bg-surface px-4 py-3 font-mono text-xs text-muted">
          {t(ui.dataContoh, lang)}
        </p>
      )}

      {/* Timeline — garis vertikal accent di tengah (desktop) / kiri (mobile).
          key={filter}: memicu remount + fade halus saat filter berubah
          (animasi reveal-up global dipakai ulang, tanpa CSS baru). */}
      <div
        key={filter}
        className="relative mt-10"
        style={{ animation: 'reveal-up 0.35s ease-out both' }}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-px bg-accent/30 lg:left-1/2 lg:-translate-x-1/2"
        />
        {filtered.length === 0 ? (
          <p className="pl-10 text-sm text-muted">
            Tidak ada cerita di kategori ini.
          </p>
        ) : (
          <ul className="space-y-10 lg:space-y-14">
            {filtered.map((entry, i) => (
              <TimelineItem
                key={entry.id}
                entry={entry}
                side={i % 2 === 0 ? 'left' : 'right'}
                categoryName={
                  categories.find((c) => c.id === entry.category_id)?.name
                }
                isLatest={i === filtered.length - 1}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
