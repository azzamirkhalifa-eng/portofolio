import { useEffect, useRef, useState } from 'react'
import { FieldLabel } from '@puckeditor/core'
import { uploadImage } from '../../../lib/storage'
import CropFrameModal from '../CropFrameModal'

/**
 * Field upload gambar untuk panel Puck (prototipe builder):
 * klik → file picker → CropFrameModal (bingkai ala Canva) → upload ke
 * Supabase Storage (`projects`) → onChange(url). Preview + ganti/hapus.
 * Semua endpoint yang sudah ada (uploadImage, CropFrameModal) dipakai
 * apa adanya — builder tidak punya pipeline gambar sendiri.
 *
 * Catatan: uploadImage sudah memakai context crop 'gallery' — cocok
 * untuk gambar fitur/screenshot (bingkai bebas/16:9/1:1).
 */
export default function ImageUploadField({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (url: string) => void
  label: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => setFile(null), [])

  /** Hasil crop → upload → URL diset ke prop elemen via onChange. */
  async function handleCropped(cropped: File) {
    setFile(null)
    setBusy(true)
    setError(null)
    try {
      const url = await uploadImage(cropped, 'projects')
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <FieldLabel label={label} />
      {value ? (
        <div className="flex items-center gap-2.5">
          <img
            src={value}
            alt=""
            className="h-12 w-16 rounded border border-hairline object-cover"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded border border-hairline px-2 py-1 text-xs text-muted transition-colors hover:border-white/40 hover:text-foreground"
          >
            Ganti
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded border border-hairline px-2 py-1 text-xs text-red-400/80 transition-colors hover:border-red-400/50 hover:text-red-400"
          >
            Hapus
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full rounded-md border border-dashed border-hairline px-3 py-2.5 text-xs text-muted transition-colors hover:border-accent/60 hover:text-foreground disabled:opacity-50"
        >
          {busy ? 'Mengunggah…' : '⬆ Unggah gambar (crop dulu di modal)'}
        </button>
      )}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setFile(f)
          e.target.value = ''
        }}
      />

      {file && (
        <CropFrameModal
          file={file}
          context="gallery"
          title={label}
          onCancel={() => setFile(null)}
          onConfirm={handleCropped}
        />
      )}
    </div>
  )
}
