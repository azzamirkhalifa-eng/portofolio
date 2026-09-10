/**
 * Ubah judul jadi URL-friendly slug, konsisten dengan backfill di
 * supabase/migration-v3.sql: huruf kecil, karakter non-alfanumerik
 * jadi "-", tanpa "-" di ujung. Mengembalikan '' kalau tidak ada
 * karakter yang bisa dipakai.
 */
export function slugify(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Slug fallback yang pasti unik (dipakai project tanpa judul). */
export function randomSlug(): string {
  return `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}