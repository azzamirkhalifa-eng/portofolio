import { useCallback, useEffect, useState, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import SectionLabel from '../components/ui/SectionLabel'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useProjects } from '../hooks/useProjects'
import { useCategories } from '../hooks/useCategories'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import { pick, t, ui } from '../lib/i18n'
import RichText from '../components/ui/RichText'
import SmoothImage from '../components/ui/SmoothImage'
import AdaptiveImage from '../components/ui/AdaptiveImage'
import ProjectLightbox from '../components/ui/ProjectLightbox'
import ZoomCue from '../components/ui/ZoomCue'
import FeatureItems, {
  type FeatureImageSideMode,
} from '../components/ui/FeatureItems'
import FeatureItemsEditor from '../components/edit/FeatureItemsEditor'
import { effectiveFeatureItems, splitIntro } from '../lib/featureItems'
import type { Slide } from 'yet-another-react-lightbox'
import RichDescription from '../components/edit/RichDescription'
import {
  hasRecordedProjectView,
  markProjectViewRecorded,
  recordProjectView,
  updateProject,
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
 * lewat lightbox (dikontrol parent).
 */
function Gallery({
  title,
  images,
  allImages,
  onOpen,
}: {
  title: string
  images: string[]
  allImages: string[]
  onOpen: (index: number) => void
}) {
  return (
    <>
      {/* Masonry: tiap item utuh (break-inside-avoid), tinggi foto asli */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {images.map((src, i) => {
        const globalIndex = allImages.indexOf(src)
        return (
          <div key={src + i} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => onOpen(globalIndex)}
              aria-label={`Perbesar gambar ${globalIndex + 1} dari ${allImages.length}`}
              className="zoom-hover block w-full overflow-hidden rounded-lg border border-hairline bg-surface-2 transition-colors hover:border-white/25"
            >
              <SmoothImage
                src={src}
                alt={`${title} — gambar ${globalIndex + 1}`}
                sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                className="block w-full h-auto rounded-[calc(0.5rem-1px)]"
              />
              <ZoomCue />
              <ZoomCue variant="dot" />
            </button>
          </div>
        )
      })}
      </div>
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
            <RichText
              key={block.id}
              text={block.text}
              className={`${blockWidthCls[block.width]} leading-[1.8] text-muted`}
            />
          )
        }
        if (block.type === 'image') {
          return (
            <div key={block.id} className={blockWidthCls[block.width]}>
              <SmoothImage src={block.src} alt={block.alt} className={imgCls} />
            </div>
          )
        }
        const imageRight = block.position === 'right'
        return (
          <div key={block.id} className="grid items-start gap-6 sm:grid-cols-2">
            <div className={imageRight ? 'sm:order-2' : ''}>
              <SmoothImage src={block.src} alt={block.alt} className={imgCls} />
            </div>
            <RichText
              text={block.text}
              className={`leading-[1.8] text-muted ${imageRight ? 'sm:order-1' : ''}`}
            />
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
      <div className="mt-6 aspect-[3/4] rounded-lg bg-surface-2 lg:aspect-video" />
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
  // Query param ?fitur=kiri|kanan — preview pola posisi gambar poin fitur
  // selain default (konstanta FEATURE_IMAGE_SIDE). Tanpa param = default.
  const location = useLocation()
  const sidePreview = new URLSearchParams(location.search).get('fitur')
  const sideMode: FeatureImageSideMode | undefined =
    sidePreview === 'kiri'
      ? 'left'
      : sidePreview === 'kanan'
        ? 'right'
        : sidePreview === 'zigzag'
          ? 'zigzag'
          : undefined
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

  // ── Data gambar & hooks lightbox — SEMUA dipanggil di atas early return
  //    (aturan Rules of Hooks: urutan hook harus sama tiap render, dan
  //    status loading → loaded tidak boleh mengganti urutan hook).
  const mainImage = project ? project.image_url || project.gallery?.[0] || '' : ''
  const shots = useMemo(
    () =>
      project
        ? (project.gallery ?? []).filter((src) => src !== mainImage)
        : [],
    [project, mainImage],
  )
  // Poin fitur efektif: DB sudah dimigrasi → kolom feature_items;
  // belum → dipecah on-the-fly dari full_description (read-only, tanpa
  // menulis DB). Bagian 3: gambar yang sudah terpasang di poin fitur
  // tidak diulang di galeri (galeri = screenshot TAMBAHAN saja).
  const featureItems = useMemo(
    () => (project ? effectiveFeatureItems(project) : []),
    [project],
  )
  const featureImages = useMemo(
    () =>
      featureItems
        .map((it) => it.image_url.trim())
        .filter((src) => src !== ''),
    [featureItems],
  )
  const galleryShots = useMemo(
    () => shots.filter((src) => !featureImages.includes(src)),
    [shots, featureImages],
  )
  // Lightbox = [gambar utama, ...gambar fitur, ...galeri].
  const allImages = useMemo(
    () =>
      [...(mainImage ? [mainImage] : []), ...featureImages, ...galleryShots],
    [mainImage, featureImages, galleryShots],
  )
  // Peta URL gambar fitur → indeks slide absolut, untuk klik → lightbox.
  const featureImageIndex = useMemo(() => {
    const map = new Map<string, number>()
    featureImages.forEach((src, i) => map.set(src, (mainImage ? 1 : 0) + i))
    return map
  }, [featureImages, mainImage])

  // Lightbox state (dibagikan main image + gallery). Komponen YARL
  // dirender TERUS (bukan conditional) supaya animasi buka-tutupnya
  // jalan — prop `open` yang menentukan tampil/tidak.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = useCallback(
    (index: number) => {
      if (index >= 0 && index < allImages.length) setLightboxIndex(index)
    },
    [allImages.length],
  )
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  // Slide lightbox = [gambar utama, ...galeri]. Referensi HARUS stabil
  // (useMemo) sesuai ketentuan prop `slides` YARL — parent bisa re-render
  // saat lightbox terbuka (mis. data refresh) tanpa me-reset carousel.
  const lightboxSlides = useMemo<Slide[]>(
    () =>
      allImages.map((src, i) => ({
        src,
        alt: `${project?.title ?? 'Project'} — gambar ${i + 1}`,
      })),
    [allImages, project?.title],
  )

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

  const buttons = projectButtonsLang(projectButtons(project), lang)
  const description =
    pick(project.full_description, project.full_description_en, lang) ||
    pick(project.description, project.description_en, lang)
  // Hero layout: paragraf pembuka dipisah dari sisa deskripsi (list
  // bernomor fitur). Keduanya tetap disimpan utuh di satu kolom.
  const { intro, rest: descRest } = splitIntro(description)

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

      {/* ── HERO: gambar utama full-width di atas ──
          Kotak menyesuaikan rasio asli gambar (deteksi dinamis), tinggi
          dibatasi ~70vh — dikonversi jadi batas lebar oleh AdaptiveImage
          supaya kotak tidak pernah pecah rasio. Screenshot potrait tampil
          proporsional (tidak gepeng), landscape memenuhi lebar hero.
          Klik gambar → lightbox (hanya saat Mode Edit MATI). */}
      {mainImage && (
        <div className={`mt-10 ${editMode ? '' : 'zoom-hover'}`}>
          <AdaptiveImage
            src={mainImage}
            alt={`Gambar utama ${project.title}`}
            sizes="100vw"
            fallbackRatio={3 / 4}
            maxHeight="70vh"
            className="w-full"
            priority
            onClick={editMode ? undefined : () => openLightbox(0)}
          >
            {!editMode && (
              <>
                <ZoomCue />
                <ZoomCue variant="dot" />
              </>
            )}
          </AdaptiveImage>
        </div>
      )}

      {/* Identitas project di bawah hero: kategori → judul → tags → intro.
          Kolom teks dibatasi ~736px supaya nyaman dibaca (tidak full lebar). */}
      <div className="mt-10 max-w-[46rem]">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
          {categoryName ?? t(ui.projects, lang)}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {pick(project.title, project.title_en, lang)}
        </h1>

        {project.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        {/* Paragraf pembuka — editor hanya menyimpan gabungan intro + sisa
            supaya full_description tetap utuh (tidak ada bagian terbuang). */}
        {intro && (
          <RichDescription
            className="mt-6 leading-[1.8] text-muted"
            ariaLabel="Edit paragraf pembuka project"
            value={intro}
            onSave={async (v) => {
              await updateProject(project.id, {
                [lang === 'en' ? 'full_description_en' : 'full_description']:
                  [v, descRest].filter((s) => s.trim() !== '').join('\n\n'),
              })
            }}
          />
        )}
      </div>

      {/* Sisa deskripsi (list bernomor fitur) — BAGIAN 2: kini dirender
          sebagai feature_items selang-seling teks ↔ gambar. Fallback
          on-the-fly menangani project lama yang belum dimigrasi DB.
          Kalau sisa deskripsi ADA tapi tidak bisa dipecah jadi poin
          (tidak berpola "1. ..."), dirender apa adanya supaya tidak ada
          teks yang hilang. Mode Edit: editor poin fitur
          (tambah/hapus/urutan/gambar). */}
      {/* Section fitur: tampil bila ADA poin terurai ATAU ADA sisa
          deskripsi. Poin fitur dari DB (feature_items terisi) tetap
          dirender meski rest kosong — konten jangan hilang. Kalau sisa
          deskripsi ADA tapi tidak bisa dipecah jadi poin (tidak berpola
          "1. ..."), dirender apa adanya (RichText) supaya tidak ada teks
          yang hilang. Editor poin fitur tersedia di SEMUA project saat
          Mode Edit — juga untuk project baru yang belum punya poin. */}
      {(descRest !== '' || featureItems.length > 0) && (
        <section className="mt-12">
          {featureItems.length > 0 ? (
            <FeatureItems
              items={featureItems}
              onOpenImage={(src) => openLightbox(featureImageIndex.get(src) ?? 0)}
              projectTitle={project.title}
              sideMode={sideMode}
            />
          ) : (
            <RichText
              text={descRest}
              className="max-w-[46rem] leading-[1.8] text-muted"
            />
          )}
          {editMode && (
            <div className="max-w-[46rem]">
              <FeatureItemsEditor project={project} />
            </div>
          )}
        </section>
      )}

      {/* Galeri screenshot TAMBAHAN (Bagian 3) — gambar yang sudah
          terpasang di poin fitur otomatis difilter agar tidak diulang. */}
      {galleryShots.length > 0 && (
        <section className="mt-16">
          <SectionLabel>{t(ui.galeri, lang)}</SectionLabel>
          <div className="mt-6">
            <Gallery
              title={project.title}
              images={galleryShots}
              allImages={allImages}
              onOpen={openLightbox}
            />
          </div>
        </section>
      )}

      {/* Lightbox (shared: main image + gallery) — yet-another-react-lightbox:
          tutup via ✕ / Esc / klik area gelap; pindah gambar via panah di
          layar, keyboard ←/→, atau swipe (animasi geser native).
          Scroll body otomatis dikunci oleh modul NoScroll YARL. */}
      {allImages.length > 0 && (
        <ProjectLightbox
          open={lightboxIndex !== null}
          index={lightboxIndex ?? 0}
          slides={lightboxSlides}
          onClose={closeLightbox}
          onView={setLightboxIndex}
        />
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
