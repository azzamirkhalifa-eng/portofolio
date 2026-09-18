import { useEffect, useState, type ReactNode } from 'react'
import TiltedCard from './TiltedCard'
import { frameDims } from '../../lib/photoDims'

type TiltedAvatarProps = {
  /** URL foto — bisa kosong/null (belum ada foto). */
  src?: string
  alt: string
  /** Batas lebar/tinggi bingkai (px), mengikuti lebar kolom hero. */
  maxWidth?: number
  maxHeight?: number
  captionText?: string
  /** Above-the-fold (foto Hero): gambar diunduh eager + prioritas tinggi. */
  priority?: boolean
  /** Ditampilkan saat src kosong ATAU gagal dimuat (URL rusak) —
   *  biasanya placeholder foto. Penting untuk Mode Edit: area tetap
   *  ada (bisa diklik untuk upload) walau URL-nya mati. */
  fallback?: ReactNode
}

/**
 * Foto profil Hero dengan efek TiltedCard (React Bits).
 *
 * Model BINGKAI MENGIKUTI HASIL CROP (ala Canva):
 * - Rasio bingkai dibaca dari token hasil crop di nama file URL
 *   (`crop-aWxH-`, ditulis CropFrameModal saat "Terapkan" dan
 *   dipertahankan oleh storage.ts di path upload).
 *   Foto di-crop 16:9 → bingkai landscape; 3:4 → tetap potret —
 *   PERSIS bentuk yang admin pilih di modal crop.
 * - Lebar bingkai = slider Lebar; tinggi = lebar ÷ rasio hasil crop,
 *   dibatasi maksimum slider Tinggi (jadi slider Tinggi berfungsi
 *   sebagai batas atas untuk foto ber-token).
 * - Foto lama / upload tanpa modal crop (tanpa token) → bingkai =
 *   kotak slider penuh seperti sebelumnya — tidak ada yang berubah.
 * - Foto mengisi penuh bingkai (object-fit: cover), bagian yang
 *   terlihat diatur drag fokus PhotoFrame.
 * - `src` kosong/gagal load → fallback placeholder (upload tetap jalan
 *   di Mode Edit).
 */
export default function TiltedAvatar({
  src,
  alt,
  maxWidth = 480,
  maxHeight = 600,
  captionText = '',
  priority = false,
  fallback,
}: TiltedAvatarProps) {
  // Catatan: komponen ini di-remount lewat `key={src}` oleh pemanggil
  // (lihat Hero), jadi state (termasuk rasio crop) selalu segar per URL
  // foto — tidak perlu reset manual di dalam efek.
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) return

    let cancelled = false
    const im = new Image()
    im.onload = () => {
      if (cancelled) return
      setReady(true)
    }
    im.onerror = () => {
      if (!cancelled) setFailed(true)
    }
    im.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  // src kosong/URL rusak → tampilkan fallback (placeholder yang tetap
  // bisa diklik untuk upload di Mode Edit). Sedang preload → render
  // kosong sesaat (mencegah kedipan placeholder).
  if (!src || failed || !ready) return <>{fallback ?? null}</>

  // Bingkai mengikuti hasil crop bila foto ber-token (rasio dari modal
  // crop); tanpa token → kotak slider purnama (perilaku foto lama).
  // Dihitung murni saat render — selalu sinkron dengan URL terbaru.
  const { width: frameW, height: frameH } = frameDims(src, maxWidth, maxHeight)

  return (
    <div
      className="relative mx-auto flex justify-center"
      style={{ width: frameW, maxWidth: '100%' }}
    >
      {/* Glow halus di belakang foto — visual lama dipertahankan */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl"
      />
      <TiltedCard
        imageSrc={src}
        altText={alt}
        captionText={captionText}
        imagePriority={priority}
        containerWidth="100%"
        containerHeight={`${frameH}px`}
        imageWidth={`${frameW}px`}
        imageHeight={`${frameH}px`}
        rotateAmplitude={10}
        scaleOnHover={1.03}
        showMobileWarning={false}
        showTooltip={Boolean(captionText)}
      />
    </div>
  )
}
