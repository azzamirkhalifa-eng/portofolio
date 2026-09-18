import type { FeatureItem, Project } from '../types'

/**
 * Feature items (poin fitur + gambar pendukung) — satu pintu:
 * - Sudah dimigrasi → array feature_items dari DB.
 * - Belum → dipecah ON-THE-FLY dari full_description (pola sama dengan
 *   parser RichText & SQL migration v17) supaya project lama langsung
 *   tampil pola baru tanpa menunggu migrasi DB — dan tanpa menulis
 *   apa pun ke database (read-only).
 *
 * Baris yang TIDAK berpola "1. ..." sebelum list pertama (paragraf
 * pembuka) diabaikan — itu intro yang dirender terpisah di hero.
 */

/**
 * "1. teks", "12) teks", dst — SATU definisi untuk seluruh app:
 * dipakai splitIntro, splitFeatureItems, RichText (fallback render),
 * dan rebuildDescription di editor. SQL migration v17 memakai pola
 * identik di sisi database (lihat scripts/verify-feature-items.mjs).
 */
export const NUMBERED_LINE = /^\s*(\d{1,3})[.)]\s+(.*)$/

/** Id deterministik (aman untuk key React & tidak berubah antar render). */
function stableId(slug: string, lang: 'id' | 'en', index: number): string {
  return `fi-${slug}-${lang}-${index + 1}`
}

/** Pecah teks menjadi feature_items (tanpa gambar). */
export function splitFeatureItems(
  text: string,
  slug: string,
  lang: 'id' | 'en',
): FeatureItem[] {
  if (!text || !text.trim()) return []
  const items: FeatureItem[] = []
  let cur: FeatureItem | null = null

  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const m = NUMBERED_LINE.exec(line)
    if (m) {
      if (cur) items.push(cur)
      cur = { id: '', title: '', title_en: '', text: '', text_en: '', image_url: '' }
      cur.text = m[2].trim()
    } else if (cur && line.trim() !== '') {
      cur.text += `\n${line.trim()}`
    }
    // Baris kosong: diabaikan, tidak memutus poin.
  }
  if (cur) items.push(cur)

  return items.map((item, i) => ({ ...item, id: stableId(slug, lang, i) }))
}

/**
 * Pisahkan paragraf pembuka dari sisa deskripsi (list bernomor dsb).
 * Aturan SAMA dengan parser RichText: intro = semua baris di awal
 * SAMPAI baris bernomor ATAU baris kosong pertama. Sisa teks tetap
 * utuh — tidak ada data yang dibuang.
 *
 * Contoh 3 kondisi wajib Tahap B:
 * - Paragraf biasa saja → seluruh teks jadi `intro`, `rest` kosong
 *   (halaman detail menampilkannya sebagai paragraf, tanpa section list).
 * - List bernomor → `rest` berisi list, dipecah jadi feature_items.
 */
export function splitIntro(text: string): { intro: string; rest: string } {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let introEnd = 0
  for (let i = 0; i < lines.length; i++) {
    if (NUMBERED_LINE.test(lines[i])) break
    introEnd = i + 1
    if (lines[i].trim() === '') break
  }
  const intro = lines.slice(0, introEnd).join('\n').trim()
  const rest = lines.slice(introEnd).join('\n').replace(/^\s+/, '')
  return { intro, rest }
}

/**
 * Feature items efektif untuk sebuah project:
 * DB sudah terisi → pakai itu; belum → pecah on-the-fly dari
 * full_description (+ versi EN per indeks kalau ada).
 */
export function effectiveFeatureItems(project: Project): FeatureItem[] {
  if (project.feature_items && project.feature_items.length > 0) {
    return project.feature_items
  }
  const descId = project.full_description || ''
  const items = splitFeatureItems(descId, project.slug || String(project.id), 'id')
  if (items.length === 0) return []

  const descEn = project.full_description_en || ''
  if (descEn.trim() !== '') {
    const enItems = splitFeatureItems(descEn, project.slug || String(project.id), 'en')
    return items.map((item, i) => ({
      ...item,
      text_en: enItems[i]?.text ?? '',
    }))
  }
  return items
}

/** Bila ada title, teks tampil di bawah title; bila tidak, teks langsung. */
export function featureItemTitle(item: FeatureItem, lang: 'id' | 'en'): string {
  return (lang === 'en' ? item.title_en || item.title : item.title).trim()
}

/** Teks poin sesuai bahasa aktif (fallback EN → ID). */
export function featureItemText(item: FeatureItem, lang: 'id' | 'en'): string {
  return (lang === 'en' ? item.text_en || item.text : item.text).trim()
}
