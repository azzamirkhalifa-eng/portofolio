/**
 * Util SEO bersama (Fitur: Open Graph meta tags).
 *
 * Situs ini adalah SPA Vite murni (semua route di-rewrite ke index.html),
 * jadi tag meta dikelola di sisi klien oleh komponen <Seo>. Util di sini
 * menyediakan URL absolut (wajib untuk og:url / og:image) dan pemendek
 * deskripsi supaya cuplikan preview tidak kepanjangan.
 */

/** Nama situs untuk og:site_name / suffix judul. */
export const SITE_NAME = 'ZAMIR'

/** Deskripsi bawaan (bahasa Indonesia) bila halaman tidak menyediakan. */
export const DEFAULT_DESCRIPTION =
  'Portofolio pribadi ZAMIR — kumpulan projek, pencapaian, dan cerita perjalanan seputar desain dan pengembangan web.'

/**
 * Basis URL situs absolut.
 * Prioritas: env `VITE_SITE_URL` (set di Vercel, mis. https://zamir.dev)
 * → origin browser saat runtime. Selalu tanpa trailing slash.
 * Dibiarkan kosong bila tidak tersedia (mis. render tanpa window).
 */
export const SITE_URL = (() => {
  const env = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  if (env) return env.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
})()

/**
 * Ubah path relatif (`/projects/foo`) atau URL apa pun menjadi URL absolut.
 * URL yang sudah `http(s)://` dibiarkan apa adanya (mis. gambar Supabase).
 */
export function absoluteUrl(value: string): string {
  const v = (value ?? '').trim()
  if (!v) return SITE_URL
  if (/^https?:\/\//i.test(v)) return v
  return `${SITE_URL}${v.startsWith('/') ? v : `/${v}`}`
}

/**
 * Rapatkan whitespace + potong teks agar nyaman sebagai meta description
 * (default maks 160 karakter, sesuai anjuran SEO umum).
 */
export function summarize(
  text: string | null | undefined,
  max = 160,
): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}
