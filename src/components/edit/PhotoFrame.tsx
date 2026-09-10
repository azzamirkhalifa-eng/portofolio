import { useRef, type CSSProperties, type ReactNode } from 'react'
import './PhotoFrame.css'

export type PhotoShape = 'rounded' | 'square' | 'arch' | 'circle'
export type PhotoFocus = { x: number; y: number }

const SHAPE_RADIUS: Record<PhotoShape, string> = {
  square: '0px',
  rounded: '1rem',
  arch: '10rem 10rem 1rem 1rem',
  circle: '9999px',
}

type PhotoFrameProps = {
  shape: PhotoShape
  focus: PhotoFocus
  /** Diberikan hanya saat Mode Edit aktif → drag fokus foto tersedia. */
  editable?: boolean
  /** Dipanggil (debounce di luar) saat admin melepas drag fokus. */
  onFocusCommit?: (focus: PhotoFocus) => void
  className?: string
  children: ReactNode
}

/**
 * Bingkai foto gaya Canva:
 * - Bentuk bingkai dari preset (kotak / rounded / arch / bulat) —
 *   diterapkan via border-radius pada SEMUA img di dalamnya, jadi
 *   efek TiltedCard ikut mengikuti bentuk bingkai.
 * - Saat Mode Edit: drag foto di dalam bingkai untuk memilih bagian
 *   foto yang tampil (object-position) — persis crop di Canva.
 * - Foto otomatis object-fit: cover, jadi tidak pernah gepeng.
 */
export default function PhotoFrame({
  shape,
  focus,
  editable = false,
  onFocusCommit,
  className = '',
  children,
}: PhotoFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; fx: number; fy: number } | null>(null)
  const liveFocus = useRef<PhotoFocus>(focus)

  const style = {
    '--photo-radius': SHAPE_RADIUS[shape] ?? SHAPE_RADIUS.rounded,
    '--photo-focus-x': `${liveFocus.current.x}%`,
    '--photo-focus-y': `${liveFocus.current.y}%`,
  } as CSSProperties

  function onPointerDown(e: React.PointerEvent) {
    if (!editable || !frameRef.current) return
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      fx: liveFocus.current.x,
      fy: liveFocus.current.y,
    }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const st = dragState.current
    const frame = frameRef.current
    if (!st || !frame) return
    const rect = frame.getBoundingClientRect()
    const w = Math.max(1, rect.width)
    const h = Math.max(1, rect.height)
    // Geser kiri = lihat bagian kanan foto (seperti crop editor umum).
    const dx = ((st.startX - e.clientX) / w) * 100
    const dy = ((st.startY - e.clientY) / h) * 100
    const clamp = (v: number) => Math.min(100, Math.max(0, v))
    liveFocus.current = { x: clamp(st.fx + dx), y: clamp(st.fy + dy) }
    frame.style.setProperty('--photo-focus-x', `${liveFocus.current.x}%`)
    frame.style.setProperty('--photo-focus-y', `${liveFocus.current.y}%`)
  }

  function endDrag() {
    if (!dragState.current) return
    dragState.current = null
    onFocusCommit?.(liveFocus.current)
  }

  return (
    <div
      ref={frameRef}
      className={`photo-frame ${editable ? 'photo-frame-editable' : ''} ${className}`.trim()}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {children}
      {editable && (
        <span className="photo-frame-hint" aria-hidden>
          ⤧ geser foto
        </span>
      )}
    </div>
  )
}
