import type { BuilderDoc, BuilderElement } from '../types/builder'
import type { FeatureItem, Project } from '../types'
import type { BuilderLang } from '../types/builder'
import { effectiveFeatureItems } from './featureItems'

/**
 * Jembatan data builder ⇄ data lama (satu pintu konversi):
 *
 * - `defaultBuilderDoc`        → tampilan AWAL builder untuk project yang
 *   belum pernah pakai builder (dari feature_items efektif — termasuk
 *   hasil parse on-the-fly dari full_description). TIDAK menulis DB.
 * - `builderDocToFeatureItems` → tulis balik ke kolom lama `feature_items`
 *   selama masa transisi (dua arah) supaya editor lama & renderer lama
 *   tetap konsisten dengan hasil builder.
 *
 * Strategi migrasi: elemen non-feature yang admin tambahkan HANYA hidup
 * di `builder_json`; kolom lama tidak pernah dihapus isinya.
 */

/** Id unik elemen baru (pola sama dengan FeatureItemsEditor). */
export function newBuilderId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Style default elemen baru — masuk akal untuk semua tipe. */
function defaultStyle(): BuilderElement['style'] {
  return { width: 'full', align: 'left' }
}

/**
 * Dokumen builder AWAL untuk sebuah project:
 * - builder_json sudah ada → pakai itu (admin pernah menyimpan).
 * - belum ada → generate dari feature_items efektif (read-only):
 *   setiap poin jadi elemen `feature` dengan side 'auto' (zigzag tetap
 *   konsisten dengan renderer lama), title jadi judul poin.
 */
export function defaultBuilderDoc(project: Project): BuilderDoc {
  const items = effectiveFeatureItems(project)
  return {
    version: 1,
    elements: items.map((item) => ({
      id: `feat-${item.id}`,
      type: 'feature' as const,
      props: {
        title: item.title ?? '',
        title_en: item.title_en ?? '',
        text: item.text ?? '',
        text_en: item.text_en ?? '',
        image_url: item.image_url ?? '',
        side: 'auto' as const,
      },
      style: { ...defaultStyle(), aspect: item.image_url ? '4/3' : undefined },
    })),
  }
}

/**
 * Ekstrak kembali FeatureItem[] dari elemen `feature` di doc —
 * untuk ditulis balik ke kolom `feature_items` (dua arah transisi).
 * Elemen non-feature diabaikan (mereka hanya hidup di builder_json).
 * Poin kosong total (tanpa teks, judul, gambar) dibuang — pola sama
 * dengan persist() FeatureItemsEditor.
 */
export function builderDocToFeatureItems(doc: BuilderDoc): FeatureItem[] {
  return doc.elements
    .filter((el) => el.type === 'feature')
    .map((el) => ({
      id: el.id,
      title: el.props.title ?? '',
      title_en: el.props.title_en ?? '',
      text: el.props.text ?? '',
      text_en: el.props.text_en ?? '',
      image_url: el.props.image_url ?? '',
    }))
    .filter(
      (it) => it.text.trim() !== '' || it.title.trim() !== '' || it.image_url.trim() !== '',
    )
}

/** Judul elemen sesuai bahasa (fallback EN → ID). */
export function elTitle(el: BuilderElement, lang: BuilderLang): string {
  return (lang === 'en' ? el.props.title_en || el.props.title : el.props.title) ?? ''
}

/** Teks elemen sesuai bahasa (fallback EN → ID). */
export function elText(el: BuilderElement, lang: BuilderLang): string {
  return (lang === 'en' ? el.props.text_en || el.props.text : el.props.text) ?? ''
}
