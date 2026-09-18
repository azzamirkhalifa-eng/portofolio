/**
 * Ukuran bingkai foto Hero/About yang benar dari satu sumber kebenaran:
 *
 * 1. Foto ber-token hasil crop (`crop-aWxH-` di URL, ditulis
 *    CropFrameModal & dipertahankan storage.ts) → bingkai mengikuti
 *    RASIO HASIL CROP — lebar = slider Lebar, tinggi = lebar ÷ rasio
 *    (dibatasi maksimum slider Tinggi). Jadi foto landscape 16:9 tampil
 *    landscape, potret 3:4 tampil potret — persis pilihan admin di modal.
 * 2. Foto lama / upload tanpa modal crop (tanpa token) → bingkai =
 *    kotak slider penuh (lebar × tinggi slider) — perilaku lama,
 *    foto lama tidak berubah tampilannya.
 *
 * Fungsi murni (tanpa efek samping) supaya bisa dipakai bersama oleh
 * TiltedAvatar (render) dan panel edit (label ukuran).
 */

import { getPresetAspectFromName } from './cropPresets'

export type FrameDims = { width: number; height: number }

/**
 * Baca rasio hasil crop dari basename URL (aman terhadap query string
 * dan karakter ter-encode). Return null bila URL tidak membawa token
 * (foto lama / upload tanpa modal crop).
 */
export function cropAspectFromUrl(url: string | undefined | null): number | null {
  if (!url) return null
  const base = decodeURIComponent((url.split('/').pop() ?? '').split('?')[0])
  const a = getPresetAspectFromName(base)
  return a !== null && Number.isFinite(a) && a > 0 ? a : null
}

/**
 * Ukuran bingkai tampil:
 * - ada rasio crop → { width: sliderW, height: min(sliderW / rasio, sliderH) }
 * - tanpa rasio   → { width: sliderW, height: sliderH } (kotak slider)
 */
export function frameDims(
  url: string | undefined | null,
  sliderW: number,
  sliderH: number,
): FrameDims {
  const a = cropAspectFromUrl(url)
  if (a === null) return { width: sliderW, height: sliderH }
  return { width: sliderW, height: Math.min(Math.round(sliderW / a), sliderH) }
}

/**
 * Label ukuran aktual untuk panel Mode Edit — mencerminkan bingkai
 * yang benar-benar dirender (mengikuti hasil crop bila ada).
 */
export function frameDimsLabel(
  url: string | undefined | null,
  sliderW: number,
  sliderH: number,
): string {
  const d = frameDims(url, sliderW, sliderH)
  return `${d.width}×${d.height}px`
}
