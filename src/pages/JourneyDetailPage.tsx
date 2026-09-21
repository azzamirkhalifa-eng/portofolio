import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SectionLabel from '../components/ui/SectionLabel'
import Button from '../components/ui/Button'
import SmoothImage from '../components/ui/SmoothImage'
import AdaptiveImage from '../components/ui/AdaptiveImage'
import ZoomCue from '../components/ui/ZoomCue'
import ProjectLightbox from '../components/ui/ProjectLightbox'
import { GalleryEditor } from '../components/edit/DetailEditors'
import { updateJourneyEntry } from '../lib/mutations'
import { useJourneyEntries, useJourneyCategories } from '../hooks/useJourneyEntries'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import { formatEntryDate, t, ui } from '../lib/i18n'
import type { Slide } from 'yet-another-react-lightbox'

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 pb-24 pt-10">
      <div className="aspect-video w-full rounded-xl bg-surface-2" />
      <div className="mt-10 h-3 w-40 rounded bg-surface-2" />
      <div className="mt-6 h-12 w-2/3 rounded bg-surface-2" />
      <div className="mt-10 h-4 w-full rounded bg-surface-2" />
      <div className="mt-2 h-4 w-5/6 rounded bg-surface-2" />
    </div>
  )
}

/**
 * Paragraf cerita — berbeda dari RichText: TANPA deteksi list bernomor
 * (cerita perjalanan tetap teks mengalir, bukan list dengan badge).
 * Baris kosong (enter ganda) memisahkan paragraf; line break tunggal
 * di dalam paragraf tetap dipertahankan (whitespace-pre-line).
 */
function StoryParagraphs({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
  return (
    <div className={`space-y-6 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  )
}

/**
 * Halaman detail cerita perjalanan — route /perjalanan/:slug.
 * Susunan mengambil pola visual halaman detail project:
 * hero foto pertama (full-width, rasio asli, klik → lightbox) →
 * breadcrumb kembali → kategori → judul → tanggal → cerita lengkap
 * (paragraf mengalir, lebar baca nyaman) → galeri masonry + lightbox.
 * Tanpa foto → hero dilewati, langsung judul (tanpa placeholder kosong).
 */
export default function JourneyDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { entries, loading } = useJourneyEntries()
  const { categories } = useJourneyCategories()
  const { lang } = useLanguage()
  const { enabled: editMode, toast } = useEditMode()

  const index = slug ? entries.findIndex((e) => e.slug === slug) : -1
  const entry = index >= 0 ? entries[index] : undefined

  // Navigasi cerita sebelum/berikutnya (urutan kronologis = urutan array)
  const prev = index > 0 ? entries[index - 1] : null
  const next =
    index >= 0 && index < entries.length - 1 ? entries[index + 1] : null

  const categoryName =
    entry && entry.category_id !== null
      ? categories.find((c) => c.id === entry.category_id)?.name
      : undefined

  // ── Gambar & lightbox — hooks SEMUA di atas early return (Rules of Hooks).
  const images = useMemo(() => entry?.gallery_images ?? [], [entry])
  // Hero = kolom hero_image TERPISAH (pola image_url vs gallery di
  // project). Fallback data lama yang belum dimigrasi: foto pertama
  // galeri dipakai sebagai hero — tampilan persis seperti sebelumnya.
  // Galeri bawah menampilkan semua gallery_images UTUH (tidak diubah).
  const heroImage = entry?.hero_image || images[0] || ''
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  // Slide lightbox = [foto utama (jika ada), ...galeri]. Referensi
  // stabil (useMemo) sesuai ketentuan prop `slides` YARL.
  const lightboxSlides = useMemo<Slide[]>(
    () => [
      ...(heroImage
        ? [{ src: heroImage, alt: `${entry?.title ?? 'Cerita'} — foto utama` }]
        : []),
      ...images.map((src, i) => ({
        src,
        alt: `${entry?.title ?? 'Cerita'} — gambar ${i + 1}`,
      })),
    ],
    [heroImage, images, entry?.title],
  )

  const openLightbox = useCallback(
    (i: number) => {
      if (i >= 0 && i < lightboxSlides.length) setLightboxIndex(i)
    },
    [lightboxSlides.length],
  )

  if (loading) {
    return <DetailSkeleton />
  }

  if (!entry) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {t(ui.ceritaTidakDitemukan, lang)}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {t(ui.ceritaTidakDitemukanDesc, lang)}
        </p>
        <div className="mt-8 flex justify-center">
          <Button to="/perjalanan" variant="ghost">
            {t(ui.kembaliKePerjalanan, lang).replace('← ', '')}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-10 sm:pt-14">
      {/* ── HERO: foto pertama galeri sebagai gambar besar full-width
          di atas — pola visual sama dengan hero di halaman detail
          project (AdaptiveImage: rasio asli dijaga, tinggi maks ~70vh,
          rounded-xl, klik → lightbox hanya saat Mode Edit MATI).
          Tanpa foto → blok ini tidak dirender sama sekali. */}
      {heroImage && (
        <div className={editMode ? '' : 'zoom-hover'}>
          <AdaptiveImage
            src={heroImage}
            alt={`Gambar utama ${entry.title}`}
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

      {/* Breadcrumb kembali — SETELAH hero (atau paling atas saat tanpa
          foto), tombol "Kembali ke Perjalanan" yang jelas */}
      <div className={heroImage ? 'mt-8' : ''}>
        <Link
          to="/perjalanan"
          data-edit-nav
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
        >
          ← {t(ui.kembaliKePerjalanan, lang).replace('← ', '')}
        </Link>
      </div>

      {/* Identitas cerita: kategori → judul → tanggal */}
      <div className="mt-10 max-w-[46rem]">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
          {categoryName ?? t(ui.perjalananJudul, lang)}
        </p>
        <h1
          className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl"
          aria-label={`${entry.title}. ${formatEntryDate(entry.entry_date, lang)}`}
        >
          {entry.title || 'Tanpa judul'}
        </h1>
        <p className="mt-4 font-mono text-sm text-muted">
          {formatEntryDate(entry.entry_date, lang)}
        </p>
      </div>

      {/* Cerita lengkap — kolom baca nyaman (maks ±704px di desktop,
          tetap mengikuti lebar layar di mobile), line-height lega,
          jarak jelas antar paragraf. Paragraf teks mengalir biasa —
          TANPA list bernomor/badge seperti di detail project. */}
      {entry.full_story && (
        <div className="mt-10 max-w-[44rem]">
          <StoryParagraphs
            text={entry.full_story}
            className="leading-[1.9] text-muted"
          />
        </div>
      )}

      {/* ── Mode Edit: kelola galeri LANGSUNG dari halaman detail —
          pola sama persis dengan editor galeri di dashboard project
          (GalleryEditor: upload Supabase Storage / URL / crop, hapus,
          tanpa batas jumlah). Perubahan tersimpan ke kolom
          gallery_images via updateJourneyEntry; tampilan publik ikut
          berubah otomatis berkat realtime subscription di
          useJourneyEntries (tanpa refresh manual).
          Foto utama (hero besar di atas) diatur TERPISAH lewat
          Dashboard → Perjalanan (pola sama dengan project). */}
      {editMode && entry && (
        <section className="mt-16 max-w-[46rem] rounded-lg border border-hairline bg-surface-2/40 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {t(ui.galeri, lang)} — Mode Edit
          </p>
          {entry.id < 0 ? (
            <p className="mt-3 text-sm text-muted">
              Ini data CONTOH (tabel journey belum ada di DB). Jalankan
              supabase/migration-v18.sql lalu kelola galeri lewat Dashboard →
              Perjalanan.
            </p>
          ) : (
            <>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                Foto-foto galeri di bawah cerita. Foto utama besar di atas
                halaman diatur terpisah lewat Dashboard → Perjalanan.
              </p>
              <div className="mt-3">
                <GalleryEditor
                  images={images}
                  folder="journey"
                  cropContext="gallery"
                  cropTitle="Foto Galeri Perjalanan"
                  onChange={async (next) => {
                    try {
                      await updateJourneyEntry(entry.id, {
                        gallery_images: next,
                      })
                      toast('success', 'Galeri disimpan.')
                    } catch (err) {
                      toast(
                        'error',
                        `Gagal menyimpan galeri: ${
                          err instanceof Error
                            ? err.message
                            : 'terjadi kesalahan.'
                        }`,
                      )
                    }
                  }}
                />
              </div>
            </>
          )}
        </section>
      )}

      {/* Galeri foto (masonry + lightbox) — semua foto galeri
          (TERPISAH dari foto utama/hero, pola detail project).
          TANPA foto → section ini tidak dirender (tidak ada judul
          "GALERI" kosong di halaman publik). */}
      {images.length > 0 && (
        <section className="mt-16">
          <SectionLabel>{t(ui.galeri, lang)}</SectionLabel>
          <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {images.map((src, i) => (
              <div key={src + i} className="mb-4 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => openLightbox(i + (heroImage ? 1 : 0))}
                  aria-label={`Perbesar gambar ${i + 1 + (heroImage ? 1 : 0)} dari ${lightboxSlides.length}`}
                  className="zoom-hover block w-full overflow-hidden rounded-lg border border-hairline bg-surface-2 transition-colors hover:border-white/25"
                >
                  <SmoothImage
                    src={src}
                    alt={`${entry.title} — gambar ${i + 1}`}
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    className="block h-auto w-full rounded-[calc(0.5rem-1px)]"
                  />
                  <ZoomCue />
                  <ZoomCue variant="dot" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Navigasi cerita sebelumnya/berikutnya (kronologis) */}
      {(prev || next) && (
        <nav className="mt-16 flex items-center justify-between gap-4 border-t border-hairline pt-8">
          {prev ? (
            <Link
              to={`/perjalanan/${prev.slug}`}
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
              to={`/perjalanan/${next.slug}`}
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

      {/* Lightbox (yet-another-react-lightbox) — pola sama dengan detail
          project: tutup via ✕/Esc/klik luar, pindah via panah/keyboard/
          swipe. Dirender TERUS (prop open) supaya animasinya jalan.
          Hero + galeri masuk slide (slide 0 = hero jika ada). */}
      {(heroImage || images.length > 0) && (
        <ProjectLightbox
          open={lightboxIndex !== null}
          index={lightboxIndex ?? 0}
          slides={lightboxSlides}
          onClose={closeLightbox}
          onView={setLightboxIndex}
        />
      )}
    </article>
  )
}
