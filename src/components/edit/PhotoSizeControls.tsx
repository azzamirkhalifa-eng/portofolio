import { useEffect, useRef, useState } from 'react'
import { updateProfile } from '../../lib/mutations'

type PhotoSizeControlsProps = {
  /** Prefix kolom di tabel profile: 'hero_photo' | 'about_photo'. */
  fieldPrefix: 'hero_photo' | 'about_photo'
  label: string
  width: number
  height: number
  onPreview: (size: { width: number; height: number }) => void
  onError?: (msg: string) => void
}

type Size = { width: number; height: number }

const COMMIT_DEBOUNCE_MS = 800

/**
 * Panel slider ukuran foto (khusus Mode Edit) — dua slider: Lebar &
 * Tinggi (px). Mengikuti pola inline-editing project:
 * - Preview langsung saat digeser (via onPreview → foto ikut berubah
 *   real-time, seperti menggeser slider skill proficiency).
 * - Simpan ke Supabase saat dilepas (onPointerUp) ATAU 800ms setelah
 *   berhenti menggeser — sama-sama aman dari spam request.
 * - Batas min/max per foto ditentukan pemanggil supaya layout
 *   section tidak bisa dirusak.
 */
export default function PhotoSizeControls({
  fieldPrefix,
  label,
  width,
  height,
  onPreview,
  onError,
}: PhotoSizeControlsProps) {
  // Nilai live slider (bisa di depan nilai tersimpan saat digeser).
  const [size, setSize] = useState<Size>({ width, height })
  const latest = useRef<Size>({ width, height })
  const commitTimer = useRef<number | null>(null)

  // Sinkron kalau nilai berubah dari luar (realtime dari perangkat lain).
  useEffect(() => {
    setSize({ width, height })
    latest.current = { width, height }
  }, [width, height])

  useEffect(() => {
    return () => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current)
    }
  }, [])

  function setDimension(dim: 'width' | 'height', value: number) {
    const next = { ...latest.current, [dim]: value }
    latest.current = next
    setSize(next)
    onPreview(next) // preview instan di foto (tanpa nunggu DB)

    if (commitTimer.current) window.clearTimeout(commitTimer.current)
    commitTimer.current = window.setTimeout(() => void commit(), COMMIT_DEBOUNCE_MS)
  }

  async function commit() {
    if (commitTimer.current) {
      window.clearTimeout(commitTimer.current)
      commitTimer.current = null
    }
    const { width: w, height: h } = latest.current
    try {
      await updateProfile({
        [`${fieldPrefix}_width`]: w,
        [`${fieldPrefix}_height`]: h,
      } as unknown as Parameters<typeof updateProfile>[0])
    } catch (err) {
      onError?.(
        `Gagal menyimpan ukuran: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      )
    }
  }

  const sliderCls = 'w-full accent-accent'

  return (
    <div className="mt-3 rounded-lg border border-hairline bg-surface/90 px-3 py-2.5 backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
        {label} — {size.width}×{size.height}px
      </p>
      <label className="mt-2 block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Lebar
        </span>
        <input
          type="range"
          min={fieldPrefix === 'hero_photo' ? 240 : 240}
          max={fieldPrefix === 'hero_photo' ? 640 : 460}
          step={4}
          value={size.width}
          aria-label={`Lebar ${label}`}
          onChange={(e) => setDimension('width', Number(e.target.value))}
          onPointerUp={() => void commit()}
          onKeyUp={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
              void commit()
            }
          }}
          className={sliderCls}
        />
      </label>
      <label className="mt-1 block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Tinggi
        </span>
        <input
          type="range"
          min={fieldPrefix === 'hero_photo' ? 320 : 300}
          max={fieldPrefix === 'hero_photo' ? 760 : 520}
          step={4}
          value={size.height}
          aria-label={`Tinggi ${label}`}
          onChange={(e) => setDimension('height', Number(e.target.value))}
          onPointerUp={() => void commit()}
          onKeyUp={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
              void commit()
            }
          }}
          className={sliderCls}
        />
      </label>
    </div>
  )
}
