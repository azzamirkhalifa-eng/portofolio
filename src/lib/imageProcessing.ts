/**
 * Pemrosesan gambar sisi klien sebelum upload ke Supabase Storage.
 *
 * Semua jalur upload (inline edit, modal crop, form admin) melewati
 * `uploadImage()` di storage.ts yang memanggil modul ini, jadi:
 * - Foto besar otomatis di-downscale (sisi terpanjang ≤ 1920px).
 * - Di-encode ke WebP kualitas 0.85 (± 25–35% lebih kecil dari JPEG
 *   dengan kualitas visual setara). PNG dengan transparansi asli tetap
 *   PNG supaya alpha-nya tidak hilang; WebP kecil (< ~300KB) lolos
 *   tanpa disentuh.
 * - `makeSmallVariant()` membuat versi resolusi rendah (`*_sm.webp`,
 *   sisi ≤ 800px) untuk layar sempit — dipilih browser lewat srcSet.
 *
 * Gagal di langkah mana pun → file asli di-upload apa adanya (never
 * block upload), jadi foto lama & alur lama tetap berfungsi normal.
 */

/** Batas sisi terpanjang foto utama (px). */
const MAX_EDGE_PX = 1920
/** Kualitas encode WebP (0–1). */
const WEBP_QUALITY = 0.85
/** WebP lebih kecil dari ini dianggap sudah optimal → tidak disentuh. */
const PASSTHROUGH_BYTES = 300 * 1024
/** Batas sisi terpanjang varian kecil untuk layar sempit (px). */
const SMALL_MAX_EDGE_PX = 800
/** Kualitas encode WebP varian kecil. */
const SMALL_QUALITY = 0.8
/** Sampler alpha di-downscale ke kira-kira sisi ini sebelum dibaca. */
const ALPHA_SAMPLE_EDGE = 256

export type ProcessedImage = {
  /** File siap upload (hasil kompresi, atau file asli bila dilewati). */
  file: File
  /** Dimensi hasil (0 bila dilewati / tidak diketahui). */
  width: number
  height: number
}

/** Muat file gambar jadi <img> terukur (dimensi asli). */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak dapat dibaca.'))
    }
    img.src = url
  })
}

/**
 * Kompres otomatis file gambar untuk upload.
 * Selalu resolve — bila ada langkah gagal, file asli dikembalikan.
 */
export async function compressImage(file: File): Promise<ProcessedImage> {
  const type = file.type.toLowerCase()

  // SVG (vektor) & GIF (animasi) tidak boleh lewat canvas — rusak.
  if (type === 'image/svg+xml' || type === 'image/gif' || !type.startsWith('image/')) {
    return { file, width: 0, height: 0 }
  }

  let img: HTMLImageElement
  try {
    img = await loadImage(file)
  } catch {
    return { file, width: 0, height: 0 }
  }

  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return { file, width: 0, height: 0 }

  const needsResize = Math.max(w, h) > MAX_EDGE_PX

  // Sudah WebP, cukup kecil, dan tidak perlu di-resize → biarkan.
  if (!needsResize && type === 'image/webp' && file.size <= PASSTHROUGH_BYTES) {
    return { file, width: w, height: h }
  }

  const hasAlpha = await detectAlpha(img, w, h)

  const scale = needsResize ? MAX_EDGE_PX / Math.max(w, h) : 1
  const tw = Math.max(1, Math.round(w * scale))
  const th = Math.max(1, Math.round(h * scale))

  let outFile = file
  if (needsResize || !hasAlpha || type !== 'image/webp') {
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Format tanpa alpha di atas latar putih (hindari hitam saat
      // PNG/JPEG di-encode ulang; alpha asli tetap dipertahankan).
      if (!hasAlpha) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, tw, th)
      }
      ctx.drawImage(img, 0, 0, tw, th)

      const outType = hasAlpha ? 'image/png' : 'image/webp'
      let outBlob: Blob | null = null
      try {
        outBlob = await canvasToBlob(canvas, outType, hasAlpha ? undefined : WEBP_QUALITY)
      } catch {
        outBlob = null
      }
      // Encode modern gagal / hasil malah lebih besar → pakai file asli.
      if (outBlob && outBlob.size < file.size) {
        outFile = new File([outBlob], `${stripExt(file.name)}.${hasAlpha ? 'png' : 'webp'}`, {
          type: outType,
        })
      }
    }
  }

  return { file: outFile, width: tw, height: th }
}

/**
 * Buat varian kecil (`*_sm.webp`, sisi ≤ 800px) untuk layar sempit.
 * Hanya untuk WebP hasil kompresi; resolve null bila tidak ada untung
 * (sudah kecil / gagal) — pemanggil boleh mengabaikannya.
 */
export async function makeSmallVariant(file: File): Promise<File | null> {
  if (file.type !== 'image/webp') return null
  try {
    const img = await loadImage(file)
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) return null

    const scale = Math.min(SMALL_MAX_EDGE_PX / Math.max(w, h), 1)
    if (scale > 0.75) return null // aslinya sudah ~kecil, tidak ada untung

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await canvasToBlob(canvas, 'image/webp', SMALL_QUALITY)
    if (!blob || blob.size >= file.size) return null
    return new File([blob], `${stripExt(file.name)}_sm.webp`, { type: 'image/webp' })
  } catch {
    return null
  }
}

/** Deteksi piksel transparan (sampling cepat pada versi mini gambar). */
function detectAlpha(img: HTMLImageElement, w: number, h: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const step = Math.max(1, Math.floor(Math.max(w, h) / ALPHA_SAMPLE_EDGE))
      const cw = Math.max(1, Math.ceil(w / step))
      const ch = Math.max(1, Math.ceil(h / step))
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return resolve(false)
      ctx.drawImage(img, 0, 0, cw, ch)
      const { data } = ctx.getImageData(0, 0, cw, ch)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) return resolve(true)
      }
      resolve(false)
    } catch {
      resolve(false)
    }
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Encoding gambar gagal.'))),
        type,
        quality,
      )
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Encoding gambar gagal.'))
    }
  })
}

function stripExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}
