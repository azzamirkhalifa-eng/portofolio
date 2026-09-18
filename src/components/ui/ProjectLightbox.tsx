import { useCallback, useMemo } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import type { Slide } from 'yet-another-react-lightbox'
import { useLanguage } from '../../context/LanguageContext'

type ProjectLightboxProps = {
  open: boolean
  /** Indeks slide aktif (pola "Tracking Slide Index" dari dokumentasi YARL). */
  index: number
  /** Daftar slide — WAJIB referensi stabil (useMemo di parent). */
  slides: Slide[]
  onClose: () => void
  /** Dipanggil saat user pindah slide — parent memperbarui state indeks. */
  onView: (index: number) => void
}

/**
 * Lightbox gambar (halaman detail project & pencapaian).
 *
 * Library: yet-another-react-lightbox — ringan (~4 KB gzip), nol
 * dependensi runtime, swipe & a11y bawaan. Fitur:
 *  - Tutup: tombol ✕, tombol Esc, atau klik area gelap di luar gambar.
 *  - Pindah gambar: panah kiri/kanan di layar, tombol ←/→ keyboard,
 *    atau swipe di layar sentuh (dengan animasi geser native).
 *  - Counter "1 / 8" kiri-atas.
 *  - Carousel finite: di gambar terakhir, panah "berikutnya" berhenti.
 * Styling mengikuti tema situs via CSS variables bawaan YARL
 * (lihat blok .project-lightbox di index.css).
 */
export default function ProjectLightbox({
  open,
  index,
  slides,
  onClose,
  onView,
}: ProjectLightboxProps) {
  const { lang } = useLanguage()

  // Label sesuai bahasa aktif (EN = default bawaan YARL).
  const labels = useMemo(
    () =>
      lang === 'en'
        ? undefined
        : {
            Previous: 'Sebelumnya',
            Next: 'Berikutnya',
            Close: 'Tutup',
            Slide: 'Gambar',
            'Photo gallery': 'Galeri foto',
            Lightbox: 'Pratinjau gambar',
            '{index} of {total}': 'Gambar {index} dari {total}',
          },
    [lang],
  )

  const handleView = useCallback(
    ({ index: current }: { index: number }) => onView(current),
    [onView],
  )

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      labels={labels}
      plugins={[Counter]}
      carousel={{ finite: true, imageFit: 'contain' }}
      on={{ view: handleView }}
      portal={{ container: { className: 'project-lightbox' } }}
    />
  )
}
