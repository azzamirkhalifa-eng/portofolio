import { useState, useRef, useEffect, type CSSProperties, type ImgHTMLAttributes, type ReactNode } from 'react'
import SmoothImage from './SmoothImage'

type AdaptiveImageProps = {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  /**
   * Elemen dekoratif (mis. ZoomCue) yang dirender di dalam kotak gambar
   * — span absolute-nya diposisikan oleh wrapper .zoom-hover di parent
   * AdaptiveImage (bukan oleh kotak ini), jadi dipasang di sini sekadar
   * diteruskan ke dalam SmoothImage.
   */
  children?: ReactNode
  /** Rasio sementara saat gambar belum termuat (mis. 3/4 untuk screenshot potrait). */
  fallbackRatio?: number
  /**
   * Batas tinggi kotak (mis. '85vh'). Rasio asli TETAP dijaga: batas tinggi
   * otomatis dikonversi menjadi batas lebar (calc(maxHeight × rasio)), jadi
   * kotak tidak pernah lebih lebar dari rasio gambar → tidak ada ruang kosong
   * kiri-kanan, di ukuran layar mana pun.
   */
  maxHeight?: string
  onClick?: () => void
  /** Nonaktifkan adaptasi rasio — kotak mengikuti dimensi natural gambar. */
  disableAdaptive?: boolean
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'sizes'>

export default function AdaptiveImage({
  src,
  alt,
  className = '',
  sizes = '100vw',
  priority = false,
  fallbackRatio = 3 / 4,
  maxHeight,
  onClick,
  disableAdaptive = false,
  children,
  ...rest
}: AdaptiveImageProps) {
  const [ratio, setRatio] = useState<number>(fallbackRatio)
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (disableAdaptive) return
    const img = imgRef.current
    if (!img) return

    const updateRatio = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setRatio(img.naturalWidth / img.naturalHeight)
      }
    }

    if (img.complete && img.naturalWidth > 0) {
      updateRatio()
    } else {
      img.onload = updateRatio
    }
    return () => {
      img.onload = null
    }
  }, [src, disableAdaptive])

  /**
   * Kunci perbaikan proporsi: kotak dibatasi LEBAR berdasarkan rasio, bukan
   * tinggi. Contoh screenshot potrait 3:4 dengan maxHeight 85vh:
   *   aspect-ratio: 0.75; max-width: calc(85vh × 0.75)
   * → di layar sempit: lebar penuh container, tinggi mengikuti rasio.
   * → di layar pendek: tinggi berhenti di 85vh, lebar menyusut proporsional
   *   (sebelumnya lebar tetap penuh → muncul band kosong kiri-kanan).
   * mx-auto menengahkan kotak saat lebih sempit dari container-nya.
   */
  const containerStyle: CSSProperties = disableAdaptive
    ? { width: '100%', maxHeight }
    : {
        aspectRatio: `${ratio}`,
        width: '100%',
        maxWidth: maxHeight ? `calc(${maxHeight} * ${ratio})` : undefined,
        marginLeft: 'auto',
        marginRight: 'auto',
      }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-hairline ${className}`}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <SmoothImage
        ref={imgRef}
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        className={`block h-full w-full object-cover ${loaded ? 'img-fade-in' : ''}`}
        style={loaded ? undefined : { backgroundColor: 'var(--color-surface-2)' }}
        onLoad={() => setLoaded(true)}
        {...rest}
      >
        {children}
      </SmoothImage>
    </div>
  )
}
