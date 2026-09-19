type ZoomCueProps = {
  /** 'cue' = ikon tengah (muncul saat hover, layar ber-mouse). */
  variant?: 'cue' | 'dot'
  /** Ukuran ikon dalam piksel — cue 34px, dot 15px secara default. */
  size?: number
}

/** Ikon kaca pembesar (stroke mengikuti warna teks & filter parent). */
export function MagnifierIcon({ size = 34 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </svg>
  )
}

/**
 * ZoomCue — pasangan efek hover "bisa diperbesar" (lihat .zoom-hover
 * di index.css) untuk gambar yang membuka lightbox:
 * - <ZoomCue/>            → overlay gelap + ikon kaca pembesar di tengah
 *   (fade-in bersama saat hover di perangkat ber-mouse).
 * - <ZoomCue variant="dot"/> → ikon kecil redup di pojok kanan-bawah,
 *   SELALU terlihat di layar sentuh (disembunyikan di perangkat
 *   ber-mouse supaya bersih) — indikasi klik tetap ada tanpa hover.
 * Semua span aria-hidden + pointer-events-none: murni dekorasi, tidak
 * mengganggu klik/aria tombol induknya.
 */
export default function ZoomCue({ variant = 'cue', size }: ZoomCueProps) {
  if (variant === 'dot') {
    return (
      <span className="zoom-hover__dot" aria-hidden>
        <MagnifierIcon size={size ?? 15} />
      </span>
    )
  }
  return (
    <>
      <span className="zoom-hover__overlay" aria-hidden />
      <span className="zoom-hover__cue" aria-hidden>
        <MagnifierIcon size={size ?? 34} />
      </span>
    </>
  )
}
