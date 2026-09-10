import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SectionLabel from '../components/ui/SectionLabel'
import Button from '../components/ui/Button'
import { useAchievements } from '../hooks/useAchievements'
import { useAchievementCategories } from '../hooks/useAchievementCategories'
import { useLanguage } from '../context/LanguageContext'
import { pick, t, ui } from '../lib/i18n'

/** Galeri masonry + lightbox — pola sama dengan halaman detail project. */
function Gallery({ title, images }: { title: string; images: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (dir: 1 | -1) => {
      setOpenIndex((i) =>
        i === null ? null : (i + dir + images.length) % images.length,
      )
    },
    [images.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openIndex, close, step])

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((src, i) => (
          <div key={src + i} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Perbesar gambar ${i + 1} dari ${images.length}`}
              className="group block w-full overflow-hidden rounded-lg border border-hairline bg-surface-2 transition-colors hover:border-white/25"
            >
              <img
                src={src}
                alt={`${title} — gambar ${i + 1}`}
                loading="lazy"
                className="block h-auto w-full rounded-[calc(0.5rem-1px)] transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Pratinjau gambar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-10"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <img
                src={images[openIndex]}
                alt={`${title} — gambar ${openIndex + 1}`}
                className="max-h-[85vh] max-w-[90vw] rounded-lg border border-hairline object-contain"
              />
              <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-xs text-white/50">
                {openIndex + 1} / {images.length}
              </p>
            </motion.div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Gambar sebelumnya"
                  onClick={(e) => {
                    e.stopPropagation()
                    step(-1)
                  }}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-lg text-white/80 transition-colors hover:border-white/40 hover:text-white sm:left-6"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Gambar berikutnya"
                  onClick={(e) => {
                    e.stopPropagation()
                    step(1)
                  }}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-lg text-white/80 transition-colors hover:border-white/40 hover:text-white sm:right-6"
                >
                  →
                </button>
              </>
            )}

            <button
              type="button"
              aria-label="Tutup pratinjau"
              onClick={close}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 pb-24 pt-10">
      <div className="h-3 w-40 rounded bg-surface-2" />
      <div className="mt-8 h-12 w-2/3 rounded bg-surface-2" />
      <div className="mt-6 aspect-video rounded-lg bg-surface-2" />
      <div className="mt-12 h-4 w-full rounded bg-surface-2" />
      <div className="mt-2 h-4 w-5/6 rounded bg-surface-2" />
    </div>
  )
}

/**
 * Halaman detail pencapaian — route /achievements/:slug.
 * Susunan mengikuti halaman detail project:
 * kembali → kategori → judul → meta (penyelenggara · tahun) →
 * deskripsi lengkap → foto utama → galeri masonry + lightbox →
 * navigasi pencapaian sebelum/berikutnya.
 */
export default function AchievementDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { achievements, loading } = useAchievements()
  const { categories } = useAchievementCategories()

  const index = slug ? achievements.findIndex((a) => a.slug === slug) : -1
  const item = index >= 0 ? achievements[index] : undefined
  const prev = index > 0 ? achievements[index - 1] : null
  const next =
    index >= 0 && index < achievements.length - 1
      ? achievements[index + 1]
      : null

  const categoryName =
    item && item.category_id !== null
      ? categories.find((c) => c.id === item.category_id)?.name
      : undefined
  const { lang } = useLanguage()

  if (loading) {
    return <DetailSkeleton />
  }

  if (!item) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {t(ui.pencapaianTidakDitemukan, lang)}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {t(ui.pencapaianTidakDitemukanDesc, lang)}
        </p>
        <div className="mt-8 flex justify-center">
          <Button to="/achievements" variant="ghost">
            {t(ui.lihatSemuaPencapaian, lang)}
          </Button>
        </div>
      </section>
    )
  }

  // Foto utama (kanan atas) & sisa foto untuk galeri (jangan dobel).
  const mainImage = item.image_url || item.gallery?.[0] || ''
  const shots = (item.gallery ?? []).filter((src) => src !== mainImage)
  const description =
    pick(item.full_description, item.full_description_en, lang) ||
    pick(item.description, item.description_en, lang)

  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-10 sm:pt-14">
      <Link
        to="/achievements"
        data-edit-nav
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
      >
        ← {t(ui.kembaliKePencapaian, lang).replace('← ', '')}
      </Link>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Kiri — teks */}
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            {categoryName ?? t(ui.pencapaian, lang)}
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {pick(item.title, item.title_en, lang)}
          </h1>

          {(item.issuer || item.year) && (
            <p className="mt-4 font-mono text-sm text-muted">
              {[pick(item.issuer, item.issuer_en, lang), item.year]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          {description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>

        {/* Kanan — foto utama, rasio asli (tidak dipotong) */}
        {mainImage && (
          <div className="flex justify-center">
            <img
              src={mainImage}
              alt={`Foto ${item.title}`}
              loading="lazy"
              className="h-auto max-h-[80vh] w-full max-w-[44rem] rounded-xl border border-hairline object-contain"
            />
          </div>
        )}
      </div>

      {/* Galeri foto (masonry + lightbox) */}
      {shots.length > 0 && (
        <section className="mt-16">
          <SectionLabel>{t(ui.galeri, lang)}</SectionLabel>
          <div className="mt-6">
            <Gallery title={item.title} images={shots} />
          </div>
        </section>
      )}

      {/* Prev / next */}
      {(prev || next) && (
        <nav className="mt-16 flex items-center justify-between gap-4 border-t border-hairline pt-8">
          {prev ? (
            <Link
              to={`/achievements/${prev.slug}`}
              data-edit-nav
              className="group min-w-0"
            >
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                {t(ui.sebelumnya, lang)}
              </span>
              <span className="mt-1 block truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/achievements/${next.slug}`}
              data-edit-nav
              className="group min-w-0 text-right"
            >
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                {t(ui.berikutnya, lang)}
              </span>
              <span className="mt-1 block truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </article>
  )
}
