import { useEffect, useState, type ReactNode } from 'react'
import TiltedCard from './TiltedCard'

type TiltedAvatarProps = {
  /** URL foto — bisa kosong/null (belum ada foto). */
  src?: string
  alt: string
  /** Luas maksimum foto (px²) sebelum diperkecil agar pas area hero. */
  maxArea?: number
  /** Batas lebar/tinggi tampil (px), mengikuti lebar kolom hero. */
  maxWidth?: number
  maxHeight?: number
  captionText?: string
  /** Ditampilkan saat src kosong ATAU gagal dimuat (URL rusak) —
   *  biasanya placeholder foto. Penting untuk Mode Edit: area tetap
   *  ada (bisa diklik untuk upload) walau URL-nya mati. */
  fallback?: ReactNode
}

/**
 * Foto profil Hero dengan efek TiltedCard (React Bits).
 *
 * Kunci dukungan "ukuran foto apa pun" (kebutuhan Mode Edit):
 * - Dimensi ASLI foto diukur lewat `new Image()` (onload) — TiltedCard
 *   lalu dirender dengan width/height tepat pada rasio foto itu.
 *   Foto lanskap/potret/square semuanya tampil UTUH tanpa terpotong.
 * - Foto besar diperkecil (bukan dipotong) agar luasnya ≤ maxArea dan
 *   sisinya ≤ maxWidth/maxHeight — jadi upload 4000×3000 maupun
 *   300×300 sama-sama rapi.
 * - `src` kosong/gagal load → komponen tidak merender apa pun;
 *   Hero menampilkan placeholder lama (dan upload tetap jalan).
 */
export default function TiltedAvatar({
  src,
  alt,
  maxArea = 360_000,
  maxWidth = 480,
  maxHeight = 600,
  captionText = '',
  fallback,
}: TiltedAvatarProps) {
  // Catatan: komponen ini di-remount lewat `key={src}` oleh pemanggil
  // (lihat Hero), jadi state selalu segar per URL foto — tidak perlu
  // reset manual di dalam efek.
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) return

    let cancelled = false
    const im = new Image()
    im.onload = () => {
      if (cancelled) return
      const nw = im.naturalWidth || 1
      const nh = im.naturalHeight || 1
      // Skala agar LUAS ≤ maxArea DAN sisi ≤ maxWidth/maxHeight.
      const scaleArea = Math.sqrt(maxArea / (nw * nh))
      const scaleSide = Math.min(maxWidth / nw, maxHeight / nh, 1)
      const s = Math.min(scaleArea, scaleSide)
      setDims({ w: Math.round(nw * s), h: Math.round(nh * s) })
      setReady(true)
    }
    im.onerror = () => {
      if (!cancelled) setFailed(true)
    }
    im.src = src
    return () => {
      cancelled = true
    }
  }, [src, maxArea, maxWidth, maxHeight])

  // src kosong/URL rusak → tampilkan fallback (placeholder yang tetap
  // bisa diklik untuk upload di Mode Edit). Sedang mengukur → render
  // kosong sesaat (mencegah kedipan placeholder).
  if (!src || failed || !ready || !dims) return <>{fallback ?? null}</>

  return (
    <div className="relative mx-auto flex justify-center">
      {/* Glow halus di belakang foto — visual lama dipertahankan */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl"
      />
      <TiltedCard
        imageSrc={src}
        altText={alt}
        captionText={captionText}
        containerWidth="100%"
        containerHeight={`${dims.h}px`}
        imageWidth={`${dims.w}px`}
        imageHeight={`${dims.h}px`}
        rotateAmplitude={10}
        scaleOnHover={1.03}
        showMobileWarning={false}
        showTooltip={Boolean(captionText)}
      />
    </div>
  )
}
