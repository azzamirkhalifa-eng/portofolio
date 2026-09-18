import { supabase } from './supabase'
import { compressImage, makeSmallVariant } from './imageProcessing'

/** Nama bucket storage (lihat supabase/schema.sql bagian STORAGE). */
const BUCKET = 'portfolio-images'

/**
 * Upload gambar ke Supabase Storage lalu kembalikan URL public-nya.
 * `folder` membedakan avatar, gambar project, dan gambar sertifikat.
 *
 * Kompresi otomatis (Fitur 2): file di-downscale (sisi ≤ 1920px) dan
 * di-encode WebP kualitas 0.85 sebelum dikirim — PNG transparan tetap
 * PNG, WebP kecil lolos apa adanya. Bila encoding gagal, file asli
 * di-upload (upload tidak pernah diblokir oleh kompresi).
 * Juga membuat varian kecil `*-crop-aWxH-*_sm.webp` (sisi ≤ 800px) untuk
 * layar sempit; kegagalan varian diabaikan begitu saja. Token rasio
 * `crop-aWxH` di nama file dipertahankan di path storage.
 */
export async function uploadImage(
  file: File,
  folder: 'avatars' | 'projects' | 'achievements',
): Promise<string> {
  const { file: compressed } = await compressImage(file)

  const ext = (compressed.name.split('.').pop() ?? 'bin').toLowerCase()

  // Pertahankan token rasio hasil crop (`crop-aWxH-`) dari nama file —
  // dibaca TiltedAvatar untuk membuat bingkai tampil SAMA dengan bentuk
  // yang admin pilih di modal crop. Nama disanitasi supaya hanya token
  // rasio yang lolos (tanpa karakter asing dari nama file admin).
  const rawBase = compressed.name.replace(/\.[^.]+$/, '')
  const cropToken = /^crop-a\d+x\d+$/.exec(rawBase.split('-').slice(0, 2).join('-'))?.[0]
  const tokenPart = cropToken ? `${cropToken}-` : ''
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${tokenPart}${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { upsert: true, contentType: compressed.type })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const url = data.publicUrl

  // Varian kecil untuk responsive image size — best-effort.
  // Nama file HARUS persis `<basename utama>_sm.webp` di folder yang
  // sama (konvensi yang dibaca dualSrcSet di imgVariant.ts).
  const small = await makeSmallVariant(compressed)
  if (small) {
    const dot = path.lastIndexOf('.')
    const smPath = dot > 0 ? `${path.slice(0, dot)}_sm.webp` : `${path}_sm.webp`
    await supabase.storage
      .from(BUCKET)
      .upload(smPath, small, { upsert: true, contentType: 'image/webp' })
    // Gagal upload varian diabaikan — SmoothImage self-heal ke URL utama.
  }

  return url
}