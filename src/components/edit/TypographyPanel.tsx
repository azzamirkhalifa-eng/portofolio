import { useEffect, useRef, useState } from 'react'
import { updateProfile } from '../../lib/mutations'

type ScaleKey =
  | 'hero_name_scale'
  | 'tagline_scale'
  | 'section_title_scale'
  | 'body_scale'
  | 'card_title_scale'
  | 'card_text_scale'

type TypographyPanelProps = {
  scales: Record<ScaleKey, number>
  onError?: (msg: string) => void
}

const ITEMS: Array<{ key: ScaleKey; label: string }> = [
  { key: 'hero_name_scale', label: 'Nama Hero' },
  { key: 'tagline_scale', label: 'Tagline Hero' },
  { key: 'section_title_scale', label: 'Judul Section (About/Contact)' },
  { key: 'body_scale', label: 'Teks Isi' },
  { key: 'card_title_scale', label: 'Judul Kartu Project' },
  { key: 'card_text_scale', label: 'Teks Kartu Project' },
]

const COMMIT_DEBOUNCE_MS = 800

/**
 * Panel "Tipografi" (khusus Mode Edit): slider skala 70–160% untuk
 * tiap elemen teks. Preview instan via onPreview; tersimpan ke DB
 * saat slider dilepas / 800ms setelah berhenti (pola sama dengan
 * PhotoSizeControls).
 */
export default function TypographyPanel({
  scales,
  onError,
}: TypographyPanelProps) {
  const [live, setLive] = useState(scales)
  const latest = useRef(scales)
  const commitTimer = useRef<number | null>(null)

  useEffect(() => {
    setLive(scales)
    latest.current = scales
  }, [scales])

  useEffect(() => {
    return () => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current)
    }
  }, [])

  function setScale(key: ScaleKey, value: number) {
    const next = { ...latest.current, [key]: value }
    latest.current = next
    setLive(next)

    if (commitTimer.current) window.clearTimeout(commitTimer.current)
    commitTimer.current = window.setTimeout(
      () => void commit(key),
      COMMIT_DEBOUNCE_MS,
    )
  }

  async function commit(key: ScaleKey) {
    if (commitTimer.current) {
      window.clearTimeout(commitTimer.current)
      commitTimer.current = null
    }
    try {
      await updateProfile({ [key]: latest.current[key] })
    } catch (err) {
      onError?.(
        `Gagal menyimpan skala: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      )
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-hairline bg-surface/90 px-3 py-2.5 backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
        Tipografi — skala ukuran teks (%)
      </p>
      <div className="mt-2 space-y-2.5">
        {ITEMS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              <span>{label}</span>
              <span className="text-accent-text">{live[key]}%</span>
            </span>
            <input
              type="range"
              min={70}
              max={160}
              step={5}
              value={live[key] ?? 100}
              aria-label={`Skala ${label}`}
              onChange={(e) => setScale(key, Number(e.target.value))}
              onPointerUp={() => void commit(key)}
              onKeyUp={(e) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                  void commit(key)
                }
              }}
              className="w-full accent-accent"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-faint/25">
        100% = ukuran default tema. Berlaku ke semua halaman secara realtime.
      </p>
    </div>
  )
}
