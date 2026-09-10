import type { ReactNode } from 'react'

type SectionBoxProps = {
  /** id section (dipakai hash navbar: /#about, dst.) */
  id?: string
  /** class tambahan untuk section di dalam kotak (scroll-mt, posisi, dst.) */
  className?: string
  children: ReactNode
}

/**
 * "Kotak" pembatas section (permintaan user):
 * - border hairline 1px (token --color-hairline-strong, putih 18% —
 *   lebih terang dari hairline biasa supaya batas kotak terlihat jelas)
 * - fill putih transparan 3% di dalam kotak (token --color-hairline-fill)
 *   supaya kotak terbaca sebagai panel, bukan sekadar garis tipis
 * - rounded-xl (12px) + padding dalam px-4 sm:px-6 (mobile lebih ramping)
 * - lebar = max-w-5xl, sama dengan layout konten (tidak full-width)
 * - margin antar kotak via my-6 sm:my-8 (kotak tidak menempel)
 * - padding vertikal section tetap di sini (py) supaya ritme antar
 *   section konsisten dari satu tempat.
 *
 * Sengaja TANPA overflow-hidden: PixelSnow tetap full-bleed di belakang
 * kotak (fixed layer), dan glow pojok About/Contact boleh "bocor" lembut
 * melewati sudut rounded sebagai aksen (keputusan user: sesuai rencana).
 */
export default function SectionBox({ id, className = '', children }: SectionBoxProps) {
  return (
    <section
      id={id}
      className={`relative mx-auto my-8 w-full max-w-5xl scroll-mt-20 rounded-xl border border-hairline-strong bg-hairline-fill px-4 py-12 sm:my-12 sm:px-6 sm:py-16 lg:py-20 ${className}`}
    >
      {children}
    </section>
  )
}
