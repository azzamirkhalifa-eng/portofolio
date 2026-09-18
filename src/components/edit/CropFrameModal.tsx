import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { getCropPresets, type CropContext, type CropPreset } from '../../lib/cropPresets'
import { loadImage } from '../../lib/imageProcessing'

type CropFrameModalProps = {
  /** Foto yang akan di-crop (dari file picker atau fetch foto yang sudah ada). */
  file: File
  /** Konteks pemasangan — menentukan pilihan bingkai yang muncul. */
  context: CropContext
  /** Judul kecil di atas modal (mis. "Foto Hero"). */
  title: string
  onCancel: () => void
  /**
   * Dipanggil saat "Terapkan": file hasil crop + RASIO BINGKAI terpilih
   * (width/height hasil potongan). Pembaca bingkai (TiltedAvatar dsb)
   * memakai rasio ini supaya bentuk tampil di halaman publik SAMA dengan
   * yang admin pilih di modal — bukan rasio kotak slider.
   */
  onConfirm: (croppedFile: File, aspect: number) => Promise<void>
}

/**
 * Modal crop ala Canva (Fitur 1):
 *
 * Langkah 1 — pilih BENTUK & UKURAN bingkai sesuai konteks (Hero: 4:5,
 * 1:1, 3:4, 16:9, bebas) lengkap dengan preview bentuknya.
 *
 * Langkah 2 — foto ditampilkan DI DALAM bingkai terpilih: geser (drag)
 * untuk menentukan bagian yang terlihat, slider/scroll untuk zoom.
 * Area di luar bingkai digelapkan supaya jelas mana yang terpotong
 * (UX sama seperti Canva/Instagram). "Terapkan" memotong via canvas —
 * hasilnya mengalir ke pipeline kompresi Feature 2 via uploadImage().
 * Rasio bingkai terpilih dibawa kembali lewat onConfirm (dan di-log ke
 * nama file) supaya bingkai tampil di halaman cocok dengan hasil crop.
 *
 * Foto dimuat sebagai DATA URL (bukan object URL). Object URL bisa
 * dicabut (revoke) terlalu cepat oleh React StrictMode double-mount,
 * membuat area crop tampil hitam; data URL tidak bisa dicabut sehingga
 * selalu stabil. Area crop juga divalidasi sebelum dipotong supaya
 * hasil hitam/kosong tidak pernah tersimpan.
 */
export default function CropFrameModal({
  file,
  context,
  title,
  onCancel,
  onConfirm,
}: CropFrameModalProps) {
  const presets = getCropPresets(context)
  const [step, setStep] = useState<'frame' | 'adjust'>('frame')
  const [preset, setPreset] = useState<CropPreset>(presets[0])
  /** Data URL foto (base64) — stabil, tidak bisa dicabut seperti object URL. */
  const [srcData, setSrcData] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Baca file jadi data URL + ukuran asli. StrictMode menjalankan effect
  // dua kali (mount → unmount → mount); karena file sama, data URL yang
  // dibuat dua kali identik, dan flag `alive` memastikan hanya mount yang
  // masih hidup yang memakai hasilnya — aman tanpa flag tambahan.
  useEffect(() => {
    let alive = true
    const reader = new FileReader()
    reader.onload = () => {
      if (!alive) return
      const dataUrl = String(reader.result)
      setSrcData(dataUrl)
      // Ukuran asli diperlukan untuk rasio "Bebas".
      const img = new Image()
      img.onload = () => {
        if (!alive) return
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      }
      img.onerror = () => {
        if (alive) setError('Foto tidak dapat dibaca. Coba format lain (JPG/PNG/WebP).')
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      if (alive) setError('Gagal membaca file foto.')
    }
    reader.readAsDataURL(file)

    return () => {
      alive = false
    }
  }, [file])

  /** Rasio bingkai aktif: 0 = bebas → rasio asli gambar. */
  const effectiveAspect =
    preset.aspect > 0 ? preset.aspect : imgSize ? imgSize.w / imgSize.h : 4 / 5

  const onCropComplete = useCallback(
    (_area: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels),
    [],
  )

  /** Potong foto sesuai bingkai → File baru (nama menyimpan rasio hasil). */
  async function applyCrop() {
    if (!srcData || !croppedAreaPixels) return
    setBusy(true)
    setError(null)
    try {
      const a = croppedAreaPixels
      // Validasi area crop — kalau tidak valid (mis. foto belum termuat di
      // cropper), jangan potong; hasilnya akan hitam/kosong kalau dipaksa.
      if (
        !Number.isFinite(a.x) ||
        !Number.isFinite(a.y) ||
        !Number.isFinite(a.width) ||
        !Number.isFinite(a.height) ||
        a.width < 2 ||
        a.height < 2
      ) {
        throw new Error('Area crop belum siap — geser/zoom foto sedikit lalu Terapkan lagi.')
      }

      const img = await loadImage(file)
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      // Klem area ke batas gambar (hindari sumber di luar gambar).
      const sx = Math.min(Math.max(0, Math.round(a.x)), Math.max(0, nw - 1))
      const sy = Math.min(Math.max(0, Math.round(a.y)), Math.max(0, nh - 1))
      const sw = Math.max(1, Math.min(Math.round(a.width), nw - sx))
      const sh = Math.max(1, Math.min(Math.round(a.height), nh - sy))
      // Batas hasil crop agar storage & loading tetap hemat.
      const outScale = Math.min(1, 1920 / Math.max(sw, sh))
      const dw = Math.max(1, Math.round(sw * outScale))
      const dh = Math.max(1, Math.round(sh * outScale))

      const canvas = document.createElement('canvas')
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas tidak tersedia di browser ini.')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)

      const keepPng = file.type === 'image/png'
      const mime = keepPng ? 'image/png' : 'image/jpeg'
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, 0.92),
      )
      if (!blob) throw new Error('Gagal memproses gambar hasil crop.')

      // Rasio hasil potongan (dari dimensi canvas, bukan angka modal)
      // dibawa ke onConfirm DAN dikodekan deterministik di nama file
      // (crop-aWxH-) sebagai fallback yang tetap cocok setelah
      // kompresi/resize di pipeline upload.
      const trueAspect = dw / dh
      const w = Math.round(trueAspect * 1000)
      const name = `crop-a${w}x1000-${Date.now()}.${keepPng ? 'png' : 'jpg'}`
      await onConfirm(new File([blob], name, { type: mime }), trueAspect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal crop gambar.')
      setBusy(false)
    }
  }

  /** Lanjut ke langkah atur: foto di-reset ke tengah + zoom awal.
   *  croppedAreaPixels sengaja di-reset ke null — area dari bingkai
   *  LAMA tidak boleh terpakai untuk bingkai baru; tombol Terapkan
   *  memang nonaktif sampai cropper menghitung ulang area yang valid. */
  function handleStartAdjust() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
    setStep('adjust')
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Crop foto"
    >
      <div className="w-full max-w-xl rounded-xl border border-hairline bg-surface p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          {step === 'frame' ? `Bentuk bingkai — ${title}` : `Atur foto — ${title}`}
        </p>

        {step === 'frame' ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPreset(p)
                    // Ganti bingkai → buang area crop lama supaya tidak
                    // pernah terpakai lintas bentuk bingkai.
                    setCroppedAreaPixels(null)
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors ${
                    preset.id === p.id
                      ? 'border-accent bg-accent/10'
                      : 'border-hairline hover:border-white/25'
                  }`}
                >
                  {/* Preview bentuk bingkai (rasio tidak proporsional — cukup mengindikasikan bentuk). */}
                  <span
                    aria-hidden
                    className="block w-full border border-white/40 bg-white/10"
                    style={{
                      aspectRatio:
                        p.aspect > 0 ? `${p.aspect}` : imgSize ? `${imgSize.w} / ${imgSize.h}` : '1',
                      borderRadius: p.previewRadius,
                    }}
                  />
                  <span className="text-center font-mono text-[9.5px] leading-tight text-muted">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-2 rounded bg-red-400/10 px-2 py-1 font-mono text-[11px] text-red-400">
                {error}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-hairline px-4 py-2 text-sm text-muted transition-colors hover:border-white/25 hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartAdjust}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Lanjut Atur Foto →
              </button>
              <span />
            </div>
          </>
        ) : (
          <>
            {/* Langkah 2: foto di dalam bingkai — drag geser, scroll/slider zoom. */}
            <div className="relative mt-3 h-[52vh] overflow-hidden rounded-lg bg-black/40">
              {srcData && imgSize ? (
                <Cropper
                  image={srcData}
                  crop={crop}
                  zoom={zoom}
                  aspect={effectiveAspect}
                  minZoom={1}
                  maxZoom={3}
                  zoomWithScroll
                  showGrid
                  restrictPosition
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
                  Memuat foto…
                </div>
              )}
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
                aria-label="Zoom foto"
              />
            </label>

            <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] text-muted">
              <button
                type="button"
                onClick={() => setStep('frame')}
                className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
              >
                ← Ganti bingkai
              </button>
              <span aria-hidden>geser foto • scroll = zoom</span>
            </div>

            {error && (
              <p className="mt-2 rounded bg-red-400/10 px-2 py-1 font-mono text-[11px] text-red-400">
                {error}
              </p>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-md border border-hairline px-4 py-2 text-sm text-muted transition-colors hover:border-white/25 hover:text-foreground disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void applyCrop()}
                disabled={busy || !srcData || !imgSize || !croppedAreaPixels}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {busy ? 'Mengunggah…' : 'Terapkan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
