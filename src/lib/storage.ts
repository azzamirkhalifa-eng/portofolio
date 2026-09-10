import { supabase } from './supabase'

/** Nama bucket storage (lihat supabase/schema.sql bagian STORAGE). */
const BUCKET = 'portfolio-images'

/**
 * Upload gambar ke Supabase Storage lalu kembalikan URL public-nya.
 * `folder` membedakan avatar, gambar project, dan gambar sertifikat.
 */
export async function uploadImage(
  file: File,
  folder: 'avatars' | 'projects' | 'achievements',
): Promise<string> {
  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}