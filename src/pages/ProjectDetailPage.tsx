import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SectionLabel from '../components/ui/SectionLabel'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useProjects } from '../hooks/useProjects'
import { useCategories } from '../hooks/useCategories'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import { pick, t, ui } from '../lib/i18n'
import {
  hasRecordedProjectView,
  markProjectViewRecorded,
  recordProjectView,
} from '../lib/mutations'
import type { ContentBlock, Project, ProjectButton } from '../types'

type BlockWidth = 'full' | 'wide' | 'half' | 'small'

/* Lebar blok konten (layout builder — bagian 3). */
const blockWidthCls: Record<BlockWidth, string> = {
  full: 'w-full',
  wide: 'w-full sm:w-5/6',
  half: 'w-full sm:w-1/2',
  small: 'w-full sm:w-1/3',
}

function ExternalLinkIcon() {
  return (
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
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

/** URL dipakai apa adanya; kalau tanpa skema, anggap https. */
function safeHref(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/**
 * Daftar tombol aksi project. Kolom `buttons` (jsonb) adalah sumber
 * utama; selama migration v4 belum dijalankan (kolom belum ada),
 * tombol diambil dari link Live Demo / GitHub lama supaya tidak
 * ada fitur yang hilang.
 */
function projectButtons(project: Project): ProjectButton[] {
  const buttons = project.buttons ?? []
  if (buttons.length > 0) {
    return buttons.map((b) => ({
      id: b.id,
      label: b.label,
      url: b.url,
    })).filter((b) => b.label !== '' || b.url !== '')
  }
  const legacy: ProjectButton[] = []
  if (project.demo_url) {
    legacy.push({ id: 'demo', label: 'Live Demo', url: project.demo_url })
  }
  if (project.github_url) {
    legacy.push({ id: 'github', label: 'GitHub', url: project.github_url })
  }
  return legacy
}

/**
 * Galeri screenshot — susunan masonry (kolom CSS) dengan tinggi
 * mengikuti rasio asli foto (TIDAK dipotong). Klik untuk memperbesar
 * lewat lightbox (panah ←/→, Esc menutup).
 */
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
      {/* Masonry: tiap item utuh (break-inside-avoid), tinggi foto asli */}
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
                className="block w-full h-auto rounded-[calc(0.5rem-1px)] transition-transform duration-500 group-hover:scale-[1.02]"
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

/** Tombol detail project sesuai bahasa aktif (label EN per tombol, fallback ID). */
function projectButtonsLang(buttons: ProjectButton[], lang: 'id' | 'en'): ProjectButton[] {
  return buttons.map((btn) => ({
    ...btn,
    label: pick(btn.label, btn.label_en, lang),
  }))
}

/** Render blok konten fleksibel — semua gambar mempertahankan rasio asli. */
function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) return null
  const imgCls =
    'h-auto w-full rounded-lg border border-hairline object-contain'
  return (
    <div className="mt-12 space-y-10">
      {blocks.map((block) => {
        if (block.type === 'text') {
          return (
            <p
              key={block.id}
              className={`${blockWidthCls[block.width]} whitespace-pre-line leading-relaxed text-muted`}
            >
              {block.text}
            </p>
          )
        }
        if (block.type === 'image') {
          return (
            <div key={block.id} className={blockWidthCls[block.width]}>
              <img src={block.src} alt={block.alt} loading="lazy" className={imgCls} />
            </div>
          )
        }
        const imageRight = block.position === 'right'
        return (
          <div key={block.id} className="grid items-start gap-6 sm:grid-cols-2">
            <div className={imageRight ? 'sm:order-2' : ''}>
              <img src={block.src} alt={block.alt} loading="lazy" className={imgCls} />
            </div>
            <p
              className={`whitespace-pre-line leading-relaxed text-muted ${
                imageRight ? 'sm:order-1' : ''
              }`}
            >
              {block.text}
            </p>
          </div>
        )
      })}
    </div>
  )
}

/** Tabel spesifikasi fleksibel (key-value) — bahasa aktif, fallback ID. */
function SpecsTable({
  specs,
  specsEn,
  lang,
}: {
  specs: Record<string, string>
  specsEn: Record<string, string> | null | undefined
  lang: 'id' | 'en'
}) {
  const en = specsEn ?? {}
  const entries = Object.entries(specs).filter(([, v]) => v !== '')
  if (entries.length === 0) return null
  return (
    <dl className="mt-4 divide-y divide-hairline rounded-lg border border-hairline bg-surface">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr] sm:gap-6"
        >
          <dt className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            {pick(key, en[key], lang)}
          </dt>
          <dd className="text-sm leading-relaxed text-foreground">
            {pick(value, en[key + '_en'], lang)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Navigasi project sebelumnya/sesudahnya (urut posisi). */
function PrevNextNav({
  prev,
  next,
}: {
  prev: Project | null
  next: Project | null
}) {
  const { lang } = useLanguage()

  if (!prev && !next) return null

  return (
    <nav className="mt-16 flex items-center justify-between gap-4 border-t border-hairline pt-8">
      {prev ? (
        <Link
          to={`/projects/${prev.slug}`}
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
          to={`/projects/${next.slug}`}
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
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 pb-24 pt-10">
      <div className="h-3 w-32 rounded bg-surface-2" />
      <div className="mt-8 h-12 w-2/3 rounded bg-surface-2" />
      <div className="mt-6 aspect-video rounded-lg bg-surface-2" />
      <div className="mt-12 h-4 w-40 rounded bg-surface-2" />
      <div className="mt-4 h-4 w-full rounded bg-surface-2" />
      <div className="mt-2 h-4 w-5/6 rounded bg-surface-2" />
    </div>
  )
}

/**
 * Halaman detail project — route /projects/:slug.
 *
 * Susunan (sesuai permintaan):
 *  - Baris atas: tombol "Kembali" + tombol aksi project (dikelola admin,
 *    bisa banyak, tiap tombol = label + URL).
 *  - Kolom kiri: kategori, judul besar, deskripsi.
 *  - Kolom kanan: gambar/foto utama — ukuran menyesuaikan rasio asli
 *    foto (tidak dipotong).
 *  - Di bawah: galeri screenshot masonry, blok konten, spesifikasi,
 *    dan navigasi project sebelumnya/berikutnya.
 */
export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { projects, loading } = useProjects()
  const { categories } = useCategories()

  const index = slug ? projects.findIndex((p) => p.slug === slug) : -1
  const project = index >= 0 ? projects[index] : undefined

  const { enabled: editMode } = useEditMode()
  const { lang } = useLanguage()

  // Penghitung view: 1x per project per sesi browser (sessionStorage),
  // jadi refresh berulang tidak menambah angka. Mode Edit di-skip agar
  // admin yang membuka project sendiri tidak menghitung view.
  const viewCounted = project !== undefined && hasRecordedProjectView(project.id)
  useEffect(() => {
    if (!project || editMode || viewCounted) return
    void recordProjectView(project.id)
      .then(() => markProjectViewRecorded(project.id))
      .catch(() => {
        // Gagal (jaringan/RLS) — biarkan kunjungan berikutnya mencoba lagi.
      })
  }, [project, editMode, viewCounted])

  const prev = index > 0 ? projects[index - 1] : null
  const next = index >= 0 && index < projects.length - 1 ? projects[index + 1] : null

  const categoryName =
    project && project.category_id !== null
      ? categories.find((c) => c.id === project.category_id)?.name
      : undefined

  if (loading) {
    return <DetailSkeleton />
  }

  if (!project) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          404
        </p>          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {t(ui.projectTidakDitemukan, lang)}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {t(ui.projectTidakDitemukanDesc, lang)}
          </p>
          <div className="mt-8 flex justify-center">
            <Button to="/projects" variant="ghost">
              {t(ui.lihatSemuaProject, lang)}
            </Button>
          </div>
      </section>
    )
  }

  // Gambar utama (kanan atas) & sisa screenshot untuk galeri masonry.
  const mainImage = project.image_url || project.gallery?.[0] || ''
  const shots = (project.gallery ?? [])
    // Kalau gambar utama diambil dari galeri, jangan tampil dua kali.
    .filter((src) => src !== mainImage)

  const buttons = projectButtonsLang(projectButtons(project), lang)
  const description =
    pick(project.full_description, project.full_description_en, lang) ||
    pick(project.description, project.description_en, lang)

  // Tombol CTA utama (kolom cta_label/cta_url) — tampil tepat di atas
  // kategori & judul. URL kosong = tombol disembunyikan.
  const ctaRawUrl = (project.cta_url ?? '').trim()
  const ctaUrl = ctaRawUrl ? safeHref(ctaRawUrl) : ''
  const ctaIsExternal = /^https?:\/\//i.test(ctaRawUrl)
  const ctaLabel = pick(project.cta_label ?? '', project.cta_label_en, lang)

  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-10 sm:pt-14">
      {/* Baris atas: kembali + tombol aksi project */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4">
        <Link
          to="/projects"
          data-edit-nav
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
        >
          ← {t(ui.kembaliKeProjects, lang).replace('← ', '')}
        </Link>          {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buttons.map((btn, i) => (
              <Button
                key={btn.id ?? `${btn.label}-${i}`}
                href={btn.url ? safeHref(btn.url) : undefined}
                variant={i === 0 ? 'primary' : 'ghost'}
                disabled={btn.url === ''}
              >
                {btn.label || 'Link'}
                {btn.url ? (
                  <ExternalLinkIcon />
                ) : (
                  <span className="ml-1 text-white/40">(tanpa link)</span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Tombol CTA utama — urutan: breadcrumb > CTA > kategori > judul > deskripsi */}
      {ctaUrl && (
        <div className="mt-8">
          <Button
            href={ctaUrl}
            target={ctaIsExternal ? '_blank' : undefined}
            rel={ctaIsExternal ? 'noreferrer' : undefined}
            variant="primary"
          >
            {ctaLabel || 'Buka Link'}
            <ExternalLinkIcon />
          </Button>
        </div>
      )}

      {/* Kolom utama: kiri = judul + deskripsi, kanan = gambar utama */}
      <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Kiri — teks */}
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            {categoryName ?? t(ui.projects, lang)}
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {pick(project.title, project.title_en, lang)}
          </h1>

          {description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">
              {description}
            </p>
          )}

          {project.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Kanan — gambar utama dengan rasio asli (tidak dipotong) */}
        {mainImage && (
          <div className="flex justify-center">
            <img
              src={mainImage}
              alt={`Gambar utama ${project.title}`}
              loading="lazy"
              className="h-auto max-h-[80vh] w-full max-w-[44rem] rounded-xl border border-hairline object-contain"
            />
          </div>
        )}
      </div>

      {/* Galeri screenshot (masonry, tinggi asli) */}
      {shots.length > 0 && (
        <section className="mt-16">
          <SectionLabel>{t(ui.galeri, lang)}</SectionLabel>
          <div className="mt-6">
            <Gallery title={project.title} images={shots} />
          </div>
        </section>
      )}

      {/* Blok konten fleksibel */}
      <ContentBlocks blocks={project.content_blocks ?? []} />

      {/* Spesifikasi */}
      {Object.keys(project.specs ?? {}).length > 0 && (
        <section className="mt-12 max-w-2xl">
          <SectionLabel>{t(ui.spesifikasi, lang)}</SectionLabel>
          <SpecsTable
            specs={project.specs ?? {}}
            specsEn={project.specs_en}
            lang={lang}
          />
        </section>
      )}

      {/* Prev / next */}
      <PrevNextNav prev={prev} next={next} />
    </article>
  )
}
