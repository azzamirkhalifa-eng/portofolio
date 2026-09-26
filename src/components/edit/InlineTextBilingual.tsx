import { useState, type ReactNode } from 'react'
import InlineText from './InlineText'
import { useLanguage } from '../../context/LanguageContext'

type InlineTextBilingualProps = {
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
  trailing?: ReactNode
}

const tabCls = (active: boolean) =>
  `rounded-t-md border-b px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
    active
      ? 'border-accent bg-accent/10 text-accent-text'
      : 'border-transparent text-muted hover:text-foreground'
  }`

/**
 * InlineText dengan dua bahasa: saat Mode Edit aktif, tampil tab kecil
 * "ID" / "EN" di atas teks — klik untuk beralih versi yang diedit.
 * Halaman publik: teks sesuai bahasa aktif (fallback ke ID otomatis
 * kalau versi EN kosong — sudah ditangani sebelum komponen ini).
 */
export default function InlineTextBilingual({
  valueId,
  valueEn,
  onSaveId,
  onSaveEn,
  enabled,
  multiline,
  placeholder,
  placeholderEn,
  ariaLabel,
  className,
  trailing,
}: InlineTextBilingualProps) {
  const { lang } = useLanguage()
  /** Tab editor aktif saat Mode Edit (default: bahasa yang sedang dipakai situs). */
  const [tab, setTab] = useState<'id' | 'en'>(lang)

  // Publik: nilai sesuai bahasa aktif — fallback ke ID kalau versi EN
  // kosong (teks tidak boleh jadi kosong sama sekali).
  if (!enabled) {
    const value =
      lang === 'en' && valueEn.trim() !== '' ? valueEn : valueId
    return (
      <InlineText
        value={value}
        onSave={lang === 'en' ? onSaveEn : onSaveId}
        multiline={multiline}
        ariaLabel={ariaLabel}
        className={className}
        trailing={trailing}
      />
    )
  }

  const value = tab === 'en' ? valueEn : valueId

  return (
    <span className="inline-flex w-full flex-col gap-1 align-top">
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setTab('id')
          }}
          className={tabCls(tab === 'id')}
        >
          ID
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setTab('en')
          }}
          className={tabCls(tab === 'en')}
        >
          EN
        </button>
      </span>
      <InlineText
        key={tab}
        value={value}
        onSave={tab === 'en' ? onSaveEn : onSaveId}
        multiline={multiline}
        placeholder={tab === 'en' ? (placeholderEn ?? placeholder) : placeholder}
        ariaLabel={ariaLabel ? `${ariaLabel} (${tab.toUpperCase()})` : undefined}
        className={className}
        trailing={tab === 'id' ? trailing : undefined}
      />
    </span>
  )
}
