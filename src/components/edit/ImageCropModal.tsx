import { useEffect, useRef, useState } from 'react'

type CropRect = { x: number; y: number; w: number; h: number }

type ImageCropModalProps = {
  file: File
  onCancel: () => void
  onConfirm: (croppedFile: File) => Promise<void>
}

type DragState =
  | { kind: 'move'; startX: number; startY: number; rect: CropRect }
  | { kind: 'resize'; handle: string; startX: number; startY: number; rect: CropRect }
  | null

const MIN_SIZE = 48
/** Batas dimensi hasil crop (hemat storage & load cepat). */
const MAX_OUT_DIM = 1600

/**
 * Modal crop gambar (Mode Edit): geser area crop, tarik sudut untuk
 * mengubah ukuran, lalu "Crop & Upload" — hasil dipotong via canvas
 * dan dikembalikan sebagai File baru untuk di-upload ke Supabase.
 * Rasio bebas (admin atur sendiri bentuk crop-nya).
 */
export default function ImageCropModal({
  file,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [srcUrl, setSrcUrl] = useState<string>('')
  const [disp, setDisp] = useState<{ w: number; h: number } | null>(null)
  const [crop, setCrop] = useState<CropRect | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<DragState>(null)

  useEffect(() => {
    // Data URL (bukan object URL): tidak bisa di-revoke lebih awal oleh
    // StrictMode double-mount (mount → unmount → mount), yang membuat
    // gambar crop tampil hitam di dev.
    let alive = true
    const reader = new FileReader()
    reader.onload = () => {
      if (alive) setSrcUrl(String(reader.result))
    }
    reader.readAsDataURL(file)
    return () => {
      alive = false
    }
  }, [file])

  function handleImgLoad() {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)
    setDisp({ w, h })
    // Crop awal: kotak 80% di tengah.
    const side = Math.min(w, h) * 0.8
    setCrop({
      x: (w - side) / 2,
      y: (h - side) / 2,
      w: side,
      h: side,
    })
  }

  function clampRect(r: CropRect, dw: number, dh: number): CropRect {
    const w = Math.min(Math.max(MIN_SIZE, r.w), dw)
    const h = Math.min(Math.max(MIN_SIZE, r.h), dh)
    return {
      w,
      h,
      x: Math.min(Math.max(0, r.x), dw - w),
      y: Math.min(Math.max(0, r.y), dh - h),
    }
  }

  function onPointerDown(e: React.PointerEvent, kind: 'move' | 'resize', handle = '') {
    if (!crop || !disp) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current =
      kind === 'move'
        ? { kind: 'move', startX: e.clientX, startY: e.clientY, rect: crop }
        : { kind: 'resize', handle, startX: e.clientX, startY: e.clientY, rect: crop }
  }

  function onPointerMove(e: React.PointerEvent) {
    const st = dragRef.current
    if (!st || !disp) return
    const dx = e.clientX - st.startX
    const dy = e.clientY - st.startY
    const r = { ...st.rect }

    if (st.kind === 'move') {
      r.x += dx
      r.y += dy
    } else {
      const h = (st as { handle: string }).handle
      if (h.includes('e')) r.w += dx
      if (h.includes('s')) r.h += dy
      if (h.includes('w')) {
        r.x += dx
        r.w -= dx
      }
      if (h.includes('n')) {
        r.y += dy
        r.h -= dy
      }
    }
    setCrop(clampRect(r, disp.w, disp.h))
  }

  function endDrag() {
    dragRef.current = null
  }

  async function handleConfirm() {
    const img = imgRef.current
    if (!img || !crop || !disp) return
    setBusy(true)
    setError(null)
    try {
      const scale = img.naturalWidth / disp.w
      const sx = Math.round(crop.x * scale)
      const sy = Math.round(crop.y * scale)
      let sw = Math.max(1, Math.round(crop.w * scale))
      let sh = Math.max(1, Math.round(crop.h * scale))

      // Turunkan skala kalau hasil crop masih terlalu besar.
      const outScale = Math.min(1, MAX_OUT_DIM / Math.max(sw, sh))
      const dw = Math.max(1, Math.round(sw * outScale))
      const dh = Math.max(1, Math.round(sh * outScale))
      sw = Math.round(sw * outScale)
      sh = Math.round(sh * outScale)

      const canvas = document.createElement('canvas')
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas tidak tersedia di browser ini.')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)

      const keepPng = file.type === 'image/png'
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', 0.92),
      )
      if (!blob) throw new Error('Gagal memproses gambar hasil crop.')

      const outName = `crop-${Date.now()}.${keepPng ? 'png' : 'jpg'}`
      const cropped = new File([blob], outName, {
        type: keepPng ? 'image/png' : 'image/jpeg',
      })
      await onConfirm(cropped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal crop gambar.')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Crop gambar"
    >
      <div className="w-full max-w-xl rounded-xl border border-hairline bg-surface p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Atur area foto — geser kotak, tarik sudut untuk ubah ukuran
        </p>

        <div
          className="relative mt-3 flex max-h-[60vh] items-center justify-center overflow-hidden rounded-lg bg-black/40"
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            ref={imgRef}
            src={srcUrl}
            alt="Pratinjau crop"
            className="max-h-[60vh] max-w-full select-none"
            onLoad={handleImgLoad}
            draggable={false}
          />

          {crop && (
            <div
              className="absolute cursor-move border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.w,
                height: crop.h,
              }}
              onPointerDown={(e) => onPointerDown(e, 'move')}
            >
              {/* 4 handle sudut untuk resize */}
              {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
                <span
                  key={h}
                  role="presentation"
                  onPointerDown={(e) => onPointerDown(e, 'resize', h)}
                  className={`absolute h-4 w-4 rounded-sm border border-white bg-accent ${

                    h === 'nw'
                      ? '-left-2 -top-2 cursor-nwse-resize'
                      : h === 'ne'
                        ? '-right-2 -top-2 cursor-nesw-resize'
                        : h === 'sw'
                          ? '-bottom-2 -left-2 cursor-nesw-resize'
                          : '-bottom-2 -right-2 cursor-nwse-resize'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 rounded bg-red-400/10 px-2 py-1 font-mono text-[11px] text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
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
            onClick={() => void handleConfirm()}
            disabled={busy || !crop}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? 'Mengunggah…' : 'Crop & Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
