/**
 * Tipe Visual Page Builder (prototipe Tahap 2 — section feature di
 * halaman detail project).
 *
 * Struktur disimpan sebagai jsonb di kolom `projects.builder_json`:
 * - `version` untuk migrasi skema satu arah ke depan.
 * - `elements` = daftar elemen berurutan (urutan array = urutan tampil).
 * - `props`   = KONTEN (bilingual — `_en` kosong = fallback versi ID).
 * - `style`   = TAMPILAN (width/align/aspect) — hanya token design system,
 *   TIDAK ada CSS bebas, jadi tema tidak bisa rusak dari builder.
 *
 * Kolom kosong/NULL = fallback perilaku lama (feature_items zigzag).
 * Selama masa transisi, builder juga menulis balik `feature_items`
 * (dua arah) supaya editor lama & renderer lama tetap konsisten.
 */

/** Lebar tampilan elemen — dipetakan ke class Tailwind di renderer. */
export type BuilderWidth = 'full' | 'wide' | 'half' | 'small'

/** Perataan horizontal isi elemen. */
export type BuilderAlign = 'left' | 'center' | 'right'

/** Style tampilan yang boleh diatur admin (tanpa CSS bebas). */
export interface BuilderStyle {
  width: BuilderWidth
  align: BuilderAlign
  /** Rasio gambar 'w/h' (mis. '16/10') — khusus elemen image. */
  aspect?: string
}

/** Kumpulan tipe elemen prototipe (kunci = tipe di Puck config). */
export type BuilderElementType = 'heading' | 'text' | 'image' | 'button' | 'feature'

/** Satu elemen halaman builder. */
export interface BuilderElement {
  /** Id stabil — key React & identitas drag/urutan (tidak tampil). */
  id: string
  type: BuilderElementType
  /** Konten (bilingual). */
  props: {
    title?: string
    title_en?: string
    /** Khusus heading: tingkat judul. */
    level?: 'h2' | 'h3'
    text?: string
    text_en?: string
    image_url?: string
    image_alt?: string
    /** Khusus button: URL tujuan. */
    href?: string
    /** Khusus button: gaya tombol. */
    variant?: 'primary' | 'ghost'
    /** Khusus feature: 'auto' = zigzag mengikuti urutan item bergambar. */
    side?: 'auto' | 'left' | 'right'
  }
  /** Tampilan (token design system). */
  style: BuilderStyle
}

/** Dokumen builder utuh untuk satu halaman/section. */
export interface BuilderDoc {
  version: 1
  elements: BuilderElement[]
}

/**
 * Konversi aman unknown → BuilderDoc | null (data dari kolom jsonb DB).
 * Mengembalikan null bila bentuk tidak dikenal → renderer fallback ke
 * sistem lama, tidak pernah crash karena data aneh.
 */
export function parseBuilderDoc(raw: unknown): BuilderDoc | null {
  if (!raw || typeof raw !== 'object') return null
  const doc = raw as Partial<BuilderDoc>
  if (doc.version !== 1 || !Array.isArray(doc.elements)) return null
  return doc as BuilderDoc
}

/** Class Tailwind lebar — satu definisi untuk renderer & konfigurasi. */
export const BUILDER_WIDTH_CLS: Record<BuilderWidth, string> = {
  full: 'w-full',
  wide: 'w-full sm:w-5/6',
  half: 'w-full sm:w-1/2',
  small: 'w-full sm:w-1/3',
}

/** Class Tailwind perataan teks. */
export const BUILDER_ALIGN_CLS: Record<BuilderAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/** Bahasa aktif render (dipakai config builder & preview). */
export type BuilderLang = 'id' | 'en'
