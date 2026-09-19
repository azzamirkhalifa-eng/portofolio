import { useState, forwardRef, type ForwardedRef, type ReactNode } from 'react'
import { dualSrcSet, markVariantMissing } from '../../lib/imgVariant'

type SmoothImageProps = {
  src: string
  alt: string
  className?: string
  /**
   * Ukuran layout gambar (CSS `sizes`) agar browser memilih varian
   * responsif yang tepat. Contoh: "(min-width:768px) 33vw, 100vw".
   */
  sizes?: string
  /** Above-the-fold (mis. foto Hero): eager + prioritas tinggi. */
  priority?: boolean
  /**
   * Elemen dekoratif yang dirender SETELAH <img> di dalam satu fragmen —
   * dipakai ZoomCue (overlay + ikon kaca pembesar) pada gambar yang
   * membuka lightbox. Span di dalamnya absolute → posisi mengikuti
   * ancestor ter-posisi (pemanggil memasang class .zoom-hover di
   * wrapper-nya sendiri supaya posisinya benar).
   */
  children?: ReactNode
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

/**
 * `<img>` dengan placeholder halus + fade-in:
 * - Selagi memuat: latar `--color-surface-2` (design token) — tidak ada
 *   kotak putih/kosong yang mengganggu.
 * - Selesai memuat: fade-in sekali via CSS animation (bukan transition,
 *   supaya tidak menimpa `transition-transform` hover pada className).
 * - Lazy by default (`loading="lazy" decoding="async"`); `priority`
 *   untuk gambar pertama layar (eager + fetchPriority high).
 * - srcSet varian kecil otomatis untuk upload baru; foto lama tanpa
 *   varian self-heal via onError (srcSet dibuang, URL utama dipakai).
 */
const SmoothImage = forwardRef<HTMLImageElement, SmoothImageProps>(
  (
    {
      src,
      alt,
      className = '',
      sizes = '100vw',
      priority = false,
      onError,
      onLoad,
      children,
    },
    ref: ForwardedRef<HTMLImageElement>
  ) => {
    const [loaded, setLoaded] = useState(false)
    const [variantFailed, setVariantFailed] = useState(false)
    const srcSet = variantFailed ? undefined : dualSrcSet(src)

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true)
      onLoad?.(e)
    }

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (!variantFailed && srcSet) {
        markVariantMissing(src)
        setVariantFailed(true)
        return
      }
      setLoaded(true)
      onError?.(e)
    }

    return (
      <>
        <img
          ref={ref}
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : undefined}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${loaded ? 'img-fade-in' : ''}`}
          style={loaded ? undefined : { backgroundColor: 'var(--color-surface-2)' }}
        />
        {children}
      </>
    )
  }
)

SmoothImage.displayName = 'SmoothImage'

export default SmoothImage
