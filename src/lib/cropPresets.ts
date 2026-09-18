/**
 * Preset BENTUK & UKURAN BINGKAI foto per konteks (Fitur 1 — crop ala Canva).
 *
 * Saat admin mengganti/upload foto di suatu tempat (Hero, About, dst),
 * modal crop menampilkan dulu pilihan bingkai yang relevan untuk konteks
 * itu, lengkap dengan preview bentuknya, lalu foto di-crop ke dalam
 * bingkai terpilih (drag posisi + zoom). Hasil crop inilah yang di-upload.
 *
 * Konteks lain (About, thumbnail project, galeri) mengikuti pola yang
 * sama — tambahkan presetnya di sini setelah pola Hero disetujui.
 */

export type CropPreset = {
  /** Kunci stabil (disimpan/mentioned di log, tak perlu unik global). */
  id: string
  /** Label yang tampil ke admin (Bahasa Indonesia). */
  label: string
  /** Rasio lebar:tinggi bingkai (width/height). */
  aspect: number
  /** Preview bentuk sudut bingkai di pilihan (CSS border-radius). */
  previewRadius: string
}

export type CropContext =
  | 'hero'
  | 'about'
  | 'project-thumbnail'
  | 'gallery'
  | 'achievement'

/** Preset per konteks — default masuk akal diletakkan paling atas. */
const CROP_PRESETS: Record<CropContext, CropPreset[]> = {
  /** Foto Hero: default mengikuti kebiasaan foto profil potret. */
  hero: [
    { id: 'hero-4-5', label: 'Potret 4:5 (rekomendasi)', aspect: 4 / 5, previewRadius: '12px' },
    { id: 'hero-1-1', label: 'Persegi 1:1', aspect: 1, previewRadius: '12px' },
    { id: 'hero-3-4', label: 'Potret 3:4', aspect: 3 / 4, previewRadius: '12px' },
    { id: 'hero-16-9', label: 'Landscape 16:9', aspect: 16 / 9, previewRadius: '12px' },
    { id: 'hero-free', label: 'Bebas (rasio asli)', aspect: 0, previewRadius: '12px' },
  ],
  about: [
    { id: 'about-1-1', label: 'Persegi 1:1', aspect: 1, previewRadius: '12px' },
    { id: 'about-4-5', label: 'Potret 4:5', aspect: 4 / 5, previewRadius: '12px' },
    { id: 'about-3-4', label: 'Potret 3:4', aspect: 3 / 4, previewRadius: '12px' },
  ],
  'project-thumbnail': [
    { id: 'thumb-16-9', label: 'Landscape 16:9 (rekomendasi)', aspect: 16 / 9, previewRadius: '12px' },
    { id: 'thumb-4-3', label: 'Landscape 4:3', aspect: 4 / 3, previewRadius: '12px' },
    { id: 'thumb-1-1', label: 'Persegi 1:1', aspect: 1, previewRadius: '12px' },
  ],
  gallery: [
    { id: 'gallery-free', label: 'Bebas (rasio asli)', aspect: 0, previewRadius: '12px' },
    { id: 'gallery-4-3', label: 'Landscape 4:3', aspect: 4 / 3, previewRadius: '12px' },
    { id: 'gallery-1-1', label: 'Persegi 1:1', aspect: 1, previewRadius: '12px' },
  ],
  achievement: [
    { id: 'achv-4-3', label: 'Landscape 4:3 (rekomendasi)', aspect: 4 / 3, previewRadius: '12px' },
    { id: 'achv-16-9', label: 'Landscape 16:9', aspect: 16 / 9, previewRadius: '12px' },
    { id: 'roll-1-1', label: 'Persegi 1:1', aspect: 1, previewRadius: '12px' },
  ],
}

export function getCropPresets(context: CropContext): CropPreset[] {
  return CROP_PRESETS[context]
}

/** Preset default konteks (elemen pertama). */
export function getDefaultPreset(context: CropContext): CropPreset {
  return CROP_PRESETS[context][0]
}

/**
 * Baca rasio hasil crop dari nama file yang dibuat CropFrameModal
 * (format: `crop-aWxH-…` di mana W:H = rasio bingkai terpilih).
 *
 * Dipakai pembaca bingkai (TiltedAvatar) supaya bentuk bingkai di
 * halaman publik SAMA dengan bentuk yang admin pilih saat crop —
 * bukan sekadar rasio kotak slider.
 *
 * Return:
 * - angka > 0 → rasio (width/height) hasil crop;
 * - null → nama tidak membawa token rasio (foto lama / tanpa crop)
 *          → pemanggil lanjut ke fallback sendiri.
 */
export function getPresetAspectFromName(name: string): number | null {
  const m = /crop-a(\d+)x(\d+)-/.exec(name)
  if (!m) return null
  const w = Number(m[1])
  const h = Number(m[2])
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
  return w / h
}
