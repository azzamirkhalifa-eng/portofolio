import { useRef, useState, type ReactNode } from 'react'
import { useEditMode } from '../../context/EditModeContext'
import { uploadImage } from '../../lib/storage'
import ImageCropModal from './ImageCropModal'
import CropFrameModal from './CropFrameModal'
import type { CropContext } from '../../lib/cropPresets'

type InlineImageProps = {
  src: string
  alt: string
  /** Simpan URL baru ke database (atau '' untuk menghapus foto). */
  onSave: (url: string) => Promise<void>
  folder: 'avatars' | 'projects' | 'achievements'
  uploadLabel?: string
  /** Radius overlay klik, sesuaikan bentuk gambar (mis. rounded-2xl). */
  shapeClass?: string
  /**
   * Konteks bingkai (Fitur 1). Diisi → upload lewat modal crop ala
   * Canva (pilih bingkai → atur drag/zoom). Kosong → modal crop lama.
   * Diisi per-tempat secara bertahap (Hero dulu, lalu sisanya).
   */
  cropContext?: CropContext
  /** Judul kecil di modal crop (mis. "Foto Hero"). */
  cropTitle?: string
  children: ReactNode
}

/**
 * Gambar yang bisa diganti langsung saat Mode Edit aktif:
 * klik area gambar -> pilih file -> upload ke Supabase Storage
 * -> URL otomatis disimpan ke database. Ada juga tombol kecil
 * untuk menghapus foto (kembali ke placeholder).
 * Saat mode edit mati, gambar tampil normal tanpa chrome apa pun.
 */
export default function InlineImage({
  src,
  alt,
  onSave,
  folder,
  uploadLabel = 'Ganti Foto',
  shapeClass = 'rounded-2xl',
  cropContext,
  cropTitle = 'Foto',
  children,
}: InlineImageProps) {
  const { enabled } = useEditMode()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** File yang menunggu di-crop (modal terbuka). */
  const [cropFile, setCropFile] = useState<File | null>(null)
  /** Sumber crop aktif: 'upload' (file baru) atau 'recrop' (foto yang sudah ada). */
  const [cropSource, setCropSource] = useState<'upload' | 'recrop'>('upload')
  const recropBusyRef = useRef(false)

  /** Dipilih dari input file → BUKAN langsung upload; buka modal crop dulu. */
  function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setCropSource('upload')
    setCropFile(file)
  }

  /** Buka foto yang SUDAH ADA di modal crop untuk disesuaikan ulang. */
  async function handleRecrop() {
    if (!src || recropBusyRef.current) return
    recropBusyRef.current = true
    setError(null)
    try {
      const res = await fetch(src, { mode: 'cors' })
      if (!res.ok) throw new Error('Foto tidak dapat dimuat.')
      const blob = await res.blob()
      const ext = (blob.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg')
      setCropSource('recrop')
      setCropFile(new File([blob], `existing.${ext}`, { type: blob.type || 'image/jpeg' }))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat foto untuk di-crop ulang.',
      )
    } finally {
      recropBusyRef.current = false
    }
  }

  /** Hasil crop dari modal → upload + simpan URL. */
  async function handleCropped(cropped: File) {
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(cropped, folder)
      await onSave(url)
      setCropFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal. Coba lagi.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (!window.confirm('Hapus foto ini?')) return
    setRemoving(true)
    setError(null)
    try {
      await onSave('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus foto.')
    } finally {
      setRemoving(false)
    }
  }

  // Mode non-edit: gambar polos, tanpa chrome.
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <div className="group/img relative">
      {children}

      {/* Klik di mana saja pada gambar = ganti foto */}
      <button
        type="button"
        aria-label={uploadLabel}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={`absolute inset-0 z-10 flex cursor-pointer items-center justify-center ring-1 ring-inset ring-accent/40 transition-colors hover:ring-accent focus:outline-none focus-visible:ring-2 ${shapeClass}`}
      >
        <span className="flex items-center gap-2 rounded-md border border-white/20 bg-black/60 px-3 py-1.5 font-mono text-[11px] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/img:opacity-100">
          {uploading ? 'Mengunggah…' : `✎ ${uploadLabel}`}
        </span>
      </button>

      {/* Hapus foto (kembali ke placeholder) */}
      {src && !uploading && (
        <button
          type="button"
          aria-label="Hapus foto"
          disabled={removing}
          onClick={() => void handleRemove()}
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xs text-white opacity-0 transition-opacity hover:text-red-300 focus:outline-none group-hover/img:opacity-100 disabled:opacity-50"
        >
          {removing ? '…' : '✕'}
        </button>
      )}

      {/* Crop ulang foto yang sudah ada (Fitur 1) — hanya bila konteks
          bingkai disetel untuk tempat ini. */}
      {src && cropContext && !uploading && (
        <button
          type="button"
          aria-label="Atur ulang crop foto"
          onClick={() => void handleRecrop()}
          className="absolute right-11 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xs text-white opacity-0 transition-opacity hover:text-accent focus:outline-none group-hover/img:opacity-100"
        >
          ⧉
        </button>
      )}

      {/* Pesan error upload/hapus */}
      {error && (
        <p className="absolute bottom-2 left-2 z-20 max-w-[90%] rounded bg-red-400/10 px-2 py-1 font-mono text-[11px] text-red-400 backdrop-blur-sm">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Modal crop: pilih bingkai + atur drag/zoom → hasil dipotong
          → di-upload. Konteks bingkai di-setel → modal baru ala Canva;
          belum → modal crop lama (perilaku tempat lain tidak berubah). */}
      {cropFile && (cropContext ? (
        <CropFrameModal
          file={cropFile}
          context={cropContext}
          title={cropSource === 'recrop' ? `${cropTitle} (yang sekarang)` : cropTitle}
          onCancel={() => {
            setCropFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          onConfirm={handleCropped}
        />
      ) : (
        <ImageCropModal
          file={cropFile}
          onCancel={() => {
            setCropFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          onConfirm={handleCropped}
        />
      ))}
      {/* alt teks tidak hilang untuk a11y meski anak menggambar img sendiri */}
      <span className="sr-only">{alt}</span>
    </div>
  )
}
