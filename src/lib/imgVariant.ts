/**
 * Helper URL varian gambar kecil (dibuat otomatis saat upload — lihat
 * `uploadImage()` di storage.ts).
 *
 * Pola: foto baru punya pasangan `..._sm.webp` (sisi ≤ 800px) di folder
 * yang sama. `<img>` menyusun srcSet dua kandidat (800w + 1920w) dan
 * browser memilih sesuai `sizes` + DPR layar.
 *
 * Foto LAMA yang belum punya varian tetap tampil normal: bila varian
 * 404, onError membuang srcSet dan memakai URL utama saja (URL itu
 * dicache di sesi ini supaya foto lain yang sama tidak mencoba lagi).
 */

/** URL yang sudah diketahui TANPA varian kecil (sesi browser ini). */
const checked = new Set<string>()

/** Tanda foto tanpa varian (dipanggil dari onError SmoothImage). */
export function markVariantMissing(url: string): void {
  if (url) checked.add(url)
}

/**
 * srcSet dua kandidat untuk URL gambar Supabase Storage, atau undefined
 * bila URL bukan dari storage publik / sudah diketahui tanpa varian.
 *
 * Hanya URL `.webp` yang dicoba — pipeline upload (storage.ts) hanya
 * membuat varian untuk WebP. PNG (transparansi) & foto lama JPEG/PNG
 * tidak pernah punya varian, jadi tidak perlu di-probe sama sekali.
 * (Deskriptor 1920w adalah asumsi batas atas — cukup akurat untuk
 * memilih varian, foto nyata boleh lebih kecil dari itu.)
 */
export function dualSrcSet(url: string): string | undefined {
  if (!url || checked.has(url)) return undefined
  if (!url.includes('/storage/v1/object/public/')) return undefined
  if (!url.toLowerCase().endsWith('.webp')) return undefined
  const dot = url.lastIndexOf('.')
  if (dot < 0 || dot < url.lastIndexOf('/')) return undefined
  return `${url.slice(0, dot)}_sm.webp 800w, ${url} 1920w`
}
