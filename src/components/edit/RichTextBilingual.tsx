import RichText from '../ui/RichText'
import InlineTextBilingual from './InlineTextBilingual'

type RichTextBilingualProps = {
  /** Nilai Bahasa Indonesia (kolom utama, wajib). */
  valueId: string
  /** Nilai English (kolom _en, opsional). */
  valueEn: string
  /** Simpan versi Bahasa Indonesia. */
  onSaveId: (next: string) => Promise<void>
  /** Simpan versi English. */
  onSaveEn: (next: string) => Promise<void>
  /** Tab bahasa tampil (Mode Edit aktif). */
  enabled: boolean
  multiline?: boolean
  placeholder?: string
  placeholderEn?: string
  ariaLabel?: string
  className?: string
}

/**
 * Pembungkus InlineTextBilingual yang sadar Mode Edit:
 * - Publik: teks dirender terstruktur (paragraf + list bernomor
 *   dengan badge angka aksen) lewat komponen RichText — fallback ke
 *   versi ID kalau versi EN kosong, sama seperti InlineTextBilingual.
 * - Mode Edit: editor bilingual asli tetap dipakai (tab ID/EN,
 *   textarea multiline) supaya konten tidak berubah cara dieditnya.
 */
export default function RichTextBilingual({
  valueId,
  valueEn,
  onSaveId,
  onSaveEn,
  enabled,
  multiline = true,
  placeholder,
  placeholderEn,
  ariaLabel,
  className,
}: RichTextBilingualProps) {
  // Versi EN kosong → fallback ke ID (publik tidak boleh kosong).
  const hasEn = valueEn.trim() !== ''

  if (!enabled) {
    return (
      <RichText
        text={hasEn ? valueEn : valueId}
        className={className}
      />
    )
  }
  return (
    <InlineTextBilingual
      valueId={valueId}
      valueEn={valueEn}
      onSaveId={onSaveId}
      onSaveEn={onSaveEn}
      enabled={enabled}
      multiline={multiline}
      placeholder={placeholder}
      placeholderEn={placeholderEn}
      ariaLabel={ariaLabel}
      className={className}
    />
  )
}
