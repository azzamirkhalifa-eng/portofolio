import { supabase } from './supabase'
import type {
  CustomSectionZone,
  Profile,
  Project,
  ProjectButton,
  Achievement,
  FeatureItem,
} from '../types'
import { randomSlug, slugify } from './slug'

/**
 * Semua penulisan ke database lewat helper di file ini (satu pintu mutasi).
 * Keamanan TIDAK bergantung pada UI — setiap query memakai client anon biasa,
 * dan Supabase RLS menolak otomatis kalau yang login bukan email admin
 * (lihat policy "admin write ..." di supabase/schema.sql).
 */

// ---------------- profile ----------------

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profile').update(patch).eq('id', 1)
  if (error) throw new Error(error.message)
}

// ---------------- skills ----------------

export async function addSkill(label: string, position: number): Promise<void> {
  const { error } = await supabase.from('skills').insert({ label, position })
  if (error) throw new Error(error.message)
}

export async function renameSkill(id: number, label: string): Promise<void> {
  const { error } = await supabase.from('skills').update({ label }).eq('id', id)
  if (error) throw new Error(error.message)
}

/** Simpan persentase penguasaan skill (0–100) untuk progress bar About. */
export async function updateSkillProficiency(
  id: number,
  proficiency: number,
): Promise<void> {
  const { error } = await supabase
    .from('skills')
    .update({ proficiency })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSkill(id: number): Promise<void> {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Tukar posisi dua item (skill/category/custom section diurutkan per `position`). */
export async function swapPositions(
  table: 'skills' | 'categories' | 'custom_sections',
  a: { id: number; position: number },
  b: { id: number; position: number },
): Promise<void> {
  const { error: e1 } = await supabase
    .from(table)
    .update({ position: b.position })
    .eq('id', a.id)
  const { error: e2 } = await supabase
    .from(table)
    .update({ position: a.position })
    .eq('id', b.id)
  if (e1) throw new Error(e1.message)
  if (e2) throw new Error(e2.message)
}

// ---------------- projects ----------------

export type ProjectFields = {
  title: string
  slug: string
  description: string
  image_url: string
  /** Thumbnail khusus beranda (opsional; kosong = pakai image_url). */
  thumbnail_url?: string
  full_description: string
  gallery: string[]
  specs: Record<string, string>
  content_blocks: unknown[]
  buttons: ProjectButton[]
  /** Poin fitur + gambar pendukung (jsonb). */
  feature_items: FeatureItem[]
  cta_label: string
  cta_url: string
  tags: string[]
  demo_url: string
  github_url: string
  category_id: number | null
  featured: boolean
  /** Versi English (Fitur bahasa). */
  title_en: string
  description_en: string
  full_description_en: string
  cta_label_en: string
  buttons_en: ProjectButton[]
  specs_en: Record<string, string>
  tags_en: string[]
  /** Dokumen visual page builder (jsonb) — null = pakai sistem lama. */
  builder_json?: unknown
}

export async function addProject(
  fields: Partial<ProjectFields> & { position: number },
): Promise<number> {
  // Slug otomatis dari judul; kalau judul kosong, pakai slug acak unik
  // (kolom slug NOT NULL). Begitu judul diisi, slug ikut diperbarui
  // lewat penyimpanan judul (lihat ProjectCard).
  const title = fields.title?.trim() ?? ''
  const slug = fields.slug?.trim() || slugify(title) || randomSlug()
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...fields, slug })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateProject(
  id: number,
  patch: Partial<ProjectFields>,
): Promise<void> {
  const { error } = await supabase.from('projects').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProject(id: number): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Tukar posisi dua project berurutan (↑/↓). */
export async function swapProjects(
  a: Pick<Project, 'id' | 'position'>,
  b: Pick<Project, 'id' | 'position'>,
): Promise<void> {
  const { error: e1 } = await supabase
    .from('projects')
    .update({ position: b.position })
    .eq('id', a.id)
  const { error: e2 } = await supabase
    .from('projects')
    .update({ position: a.position })
    .eq('id', b.id)
  if (e1) throw new Error(e1.message)
  if (e2) throw new Error(e2.message)
}

// ---------------- categories ----------------

export async function addCategory(name: string, position: number): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name, position })
  if (error) throw new Error(error.message)
}

export async function renameCategory(id: number, name: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** Hapus kategori. Project yang memakainya otomatis jadi tanpa kategori (FK on delete set null). */
export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Pindahkan project-project dari satu kategori ke kategori lain. */
export async function moveProjectsToCategory(
  fromCategoryId: number,
  toCategoryId: number | null,
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ category_id: toCategoryId })
    .eq('category_id', fromCategoryId)
  if (error) throw new Error(error.message)
}

// ---------------- custom sections ----------------

export type CustomSectionFields = {
  zone: CustomSectionZone
  position: number
  visible: boolean
  layout: 'text' | 'text-image'
  title: string
  text: string
  image_url: string
  link_label: string
  link_url: string
  /** Versi English (Fitur bahasa). */
  title_en: string
  text_en: string
  link_label_en: string
}

export async function addCustomSection(
  zone: CustomSectionZone,
  position: number,
): Promise<number> {
  const { data, error } = await supabase
    .from('custom_sections')
    .insert({ zone, position })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateCustomSection(
  id: number,
  patch: Partial<CustomSectionFields>,
): Promise<void> {
  const { error } = await supabase
    .from('custom_sections')
    .update(patch)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCustomSection(id: number): Promise<void> {
  const { error } = await supabase
    .from('custom_sections')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------- stats (section Statistik/Pencapaian) ----------------

export async function addStat(label: string, value: number, position: number): Promise<string> {
  const { data, error } = await supabase
    .from('stats')
    .insert({ label, value, position })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateStat(id: string, patch: { label?: string; value?: number; visible?: boolean }): Promise<void> {
  const { error } = await supabase.from('stats').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteStat(id: string): Promise<void> {
  const { error } = await supabase.from('stats').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------- achievements (sertifikat & pencapaian) ----------------

export async function addAchievement(position: number): Promise<number> {
  const { data, error } = await supabase
    .from('achievements')
    .insert({ title: '', position })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

/** Buat achievement lengkap (dipakai dashboard admin). */
export type AchievementFields = {
  title: string
  issuer: string
  year: string
  image_url: string
  description: string
  category_id: number | null
  featured: boolean
  slug?: string
  full_description: string
  gallery: string[]
  /** Versi English (Fitur bahasa). */
  title_en: string
  description_en: string
  full_description_en: string
  issuer_en: string
}

export async function createAchievement(
  fields: AchievementFields,
  position: number,
): Promise<number> {
  // Slug otomatis dari judul; kalau kosong, pakai slug acak unik.
  const slug =
    fields.slug?.trim() || slugify(fields.title) || `pencapaian-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('achievements')
    .insert({ ...fields, slug, position })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateAchievement(
  id: number,
  patch: Partial<Omit<Achievement, 'id' | 'created_at' | 'updated_at'>>,
): Promise<void> {
  const { error } = await supabase
    .from('achievements')
    .update(patch)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteAchievement(id: number): Promise<void> {
  const { error } = await supabase.from('achievements').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------- achievement categories ----------------

export async function addAchievementCategory(
  name: string,
  position: number,
): Promise<void> {
  const { error } = await supabase
    .from('achievement_categories')
    .insert({ name, position })
  if (error) throw new Error(error.message)
}

export async function updateAchievementCategory(
  id: number,
  patch: { name?: string; position?: number },
): Promise<void> {
  const { error } = await supabase
    .from('achievement_categories')
    .update(patch)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function renameAchievementCategory(
  id: number,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from('achievement_categories')
    .update({ name })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Hapus kategori pencapaian. Sertifikat yang memakainya otomatis
 * jadi tanpa kategori (FK on delete set null) — datanya tetap ada.
 */
export async function deleteAchievementCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('achievement_categories')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** Tukar posisi dua achievement berurutan (↑/↓). */
export async function swapAchievements(
  a: Pick<Achievement, 'id' | 'position'>,
  b: Pick<Achievement, 'id' | 'position'>,
): Promise<void> {
  const { error: e1 } = await supabase
    .from('achievements')
    .update({ position: b.position })
    .eq('id', a.id)
  const { error: e2 } = await supabase
    .from('achievements')
    .update({ position: a.position })
    .eq('id', b.id)
  if (e1) throw new Error(e1.message)
  if (e2) throw new Error(e2.message)
}

// ---------------- messages (form kontak) ----------------

/**
 * Kirim pesan dari form kontak. DIPANGGIL SEBAGAI ANON — RLS mengizinkan
 * INSERT untuk siapa pun, jadi tidak butuh login.
 */
export async function sendMessage(
  fields: { name: string; email: string; message: string },
): Promise<void> {
  const { error } = await supabase.from('messages').insert(fields)
  if (error) throw new Error(error.message)
}

/** Admin: tandai satu pesan sudah dibaca. */
export async function markMessageRead(id: number): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** Admin: hapus satu pesan. */
export async function deleteMessage(id: number): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------- project views (penghitung view) ----------------

/**
 * Kunci sessionStorage supaya 1 pengunjung (per sesi/tab browser) hanya
 * dihitung 1x per project — refresh berulang tidak menambah view.
 */
const VIEWED_KEY = 'portfolio_viewed_projects'

/** Sudah terhitung untuk sesi ini? (aman kalau sessionStorage tidak tersedia) */
export function hasRecordedProjectView(projectId: number): boolean {
  try {
    const raw = window.sessionStorage.getItem(VIEWED_KEY)
    const ids: number[] = raw ? (JSON.parse(raw) as number[]) : []
    return ids.includes(projectId)
  } catch {
    return false
  }
}

/**
 * Tandai project sudah terhitung untuk sesi ini (dipanggil SETELAH RPC
 * sukses, supaya kegagalan jaringan tidak "membuang" view).
 */
export function markProjectViewRecorded(projectId: number): void {
  try {
    const raw = window.sessionStorage.getItem(VIEWED_KEY)
    const ids: number[] = raw ? (JSON.parse(raw) as number[]) : []
    if (!ids.includes(projectId)) {
      ids.push(projectId)
      window.sessionStorage.setItem(VIEWED_KEY, JSON.stringify(ids))
    }
  } catch {
    /* storage penuh/diblokir — abaikan */
  }
}

/**
 * Tambah 1 view untuk project (dipanggil pengunjung halaman detail).
 * Lewat RPC security definer supaya anon tidak butuh hak UPDATE langsung
 * di tabel projects (RLS tetap rapat).
 */
export async function recordProjectView(projectId: number): Promise<void> {
  const { error } = await supabase.rpc('increment_project_view', {
    p_project_id: projectId,
  })
  if (error) throw new Error(error.message)
}

// ---------------- proses (section Cara Kerja Saya) ----------------

export async function addProses(position: number, icon: string, description: string): Promise<string> {
  const { data, error } = await supabase
    .from('proses')
    .insert({ position, icon, description })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateProses(id: string, patch: { position?: number; icon?: string; description?: string; visible?: boolean }): Promise<void> {
  const { error } = await supabase.from('proses').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProses(id: string): Promise<void> {
  const { error } = await supabase.from('proses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
