import RichText from '../ui/RichText'
import InlineText from './InlineText'
import { useEditMode } from '../../context/EditModeContext'

type RichDescriptionProps = {
  /** Teks multi-baris (bisa mengandung list bernomor). */
  value: string
  /** Simpan teks ke database (hanya dipakai saat Mode Edit aktif). */
  onSave: (next: string) => Promise<void>
  /** Kelas kontainer — diwarisi paragraf & item list (warna, line-height, dsb). */
  className?: string
  ariaLabel?: string
  multiline?: boolean
}

/**
 * Pembungkus RichText yang sadar Mode Edit:
 * - Publik: teks dirender terstruktur (paragraf + list bernomor
 *   dengan badge angka aksen) lewat komponen RichText.
 * - Mode Edit: editor InlineText asli tetap dipakai (textarea
 *   multiline) supaya konten tidak berubah cara dieditnya.
 */
export default function RichDescription({
  value,
  onSave,
  className = '',
  ariaLabel,
  multiline = true,
}: RichDescriptionProps) {
  const { enabled } = useEditMode()

  if (enabled) {
    return (
      <InlineText
        value={value}
        onSave={onSave}
        multiline={multiline}
        ariaLabel={ariaLabel}
        className={className}
      />
    )
  }
  return <RichText text={value} className={className} />
}
