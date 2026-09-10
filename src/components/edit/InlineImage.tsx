import { useRef, useState, type ReactNode } from 'react'
import { useEditMode } from '../../context/EditModeContext'
import { uploadImage } from '../../lib/storage'
import ImageCropModal from './ImageCropModal'

type InlineImageProps = {
  src: string
  alt: string
  /** Simpan URL baru ke database (atau '' untuk menghapus foto). */
  onSave: (url: string) => Promise<void>
  folder: 'avatars' | 'projects' | 'achievements'
  uploadLabel?: string
  /** Radius overlay klik, sesuaikan bentuk gambar (mis. rounded-2xl). */
  shapeClass?: string
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
  children,
}: InlineImageProps) {
  const { enabled } = useEditMode()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** File yang menunggu di-crop (modal terbuka). */
  const [cropFile, setCropFile] = useState<File | null>(null)

  /** Dipilih dari input file → BUKAN langsung upload; buka modal crop dulu. */
  function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setCropFile(file)
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

      {/* Modal crop: geser/tarik area → hasil dipotong → di-upload. */}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => {
            setCropFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          onConfirm={handleCropped}
        />
      )}
      {/* alt teks tidak hilang untuk a11y meski anak menggambar img sendiri */}
      <span className="sr-only">{alt}</span>
    </div>
  )
}
