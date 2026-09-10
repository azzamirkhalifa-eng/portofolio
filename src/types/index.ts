/** Struktur tabel `profile` di Supabase (satu baris, id = 1). */
export interface Profile {
  id: number
  name: string
  tagline: string
  hero_cta_text: string
  about_title: string
  about_text: string
  /** Versi English (Fitur bahasa) — kosong = fallback tampil versi ID. */
  tagline_en: string
  hero_cta_text_en: string
  about_title_en: string
  about_text_en: string
  /** Foto di Hero. */
  avatar_url: string
  /** Foto sendiri di section About (terpisah dari Hero). */
  about_avatar_url: string
  /** Posisi foto About: 'left' | 'right'. */
  about_photo_side: 'left' | 'right'
  /** Jumlah kolom grid Projects: 1 | 2 | 3. */
  projects_columns: number
  /** Ukuran (px, maksimum tampilan) foto Hero — diatur admin via Mode Edit. */
  hero_photo_width: number
  hero_photo_height: number
  /** Ukuran (px, maksimum tampilan) foto About (TiltedCard). */
  about_photo_width: number
  about_photo_height: number
  /** Skala tipografi per elemen (persen, 100 = default tema). */
  hero_name_scale: number
  tagline_scale: number
  section_title_scale: number
  body_scale: number
  card_title_scale: number
  card_text_scale: number
  /** Bingkai foto gaya Canva: bentuk + titik fokus (crop) foto. */
  hero_photo_shape: 'rounded' | 'square' | 'arch' | 'circle'
  hero_photo_focus_x: number
  hero_photo_focus_y: number
  about_photo_shape: 'rounded' | 'square' | 'arch' | 'circle'
  about_photo_focus_x: number
  about_photo_focus_y: number
  email: string
  github_url: string
  instagram_url: string
  linkedin_url: string
  twitter_url: string
  updated_at: string
}

/** Struktur tabel `skills` di Supabase. */
export interface Skill {
  id: number
  label: string
  position: number
  /** Persentase penguasaan 0–100 — untuk progress bar di About. */
  proficiency: number
}

/** Struktur tabel `categories` di Supabase. */
export interface Category {
  id: number
  name: string
  position: number
}

/**
 * Tombol aksi project (label + tujuan URL), tampil di atas halaman
 * detail project. Bisa lebih dari satu — dikelola admin lewat
 * kolom jsonb `buttons` di tabel projects.
 */
export interface ProjectButton {
  id: string
  label: string
  url: string
  /** Label versi English (opsional; kosong = pakai `label`). */
  label_en?: string
}

/** Struktur tabel `projects` di Supabase. */
export interface Project {
  id: number
  title: string
  description: string
  image_url: string
  tags: string[]
  demo_url: string
  github_url: string
  category_id: number | null
  position: number
  created_at: string
  updated_at: string
  /** URL-friendly id untuk halaman detail (/projects/:slug). */
  slug: string
  /** Deskripsi lengkap di halaman detail (terpisah dari deskripsi singkat di card). */
  full_description: string
  /** Galeri screenshot/gambar project (array URL). */
  gallery: string[]
  /** Spesifikasi fleksibel key-value, mis. {"Peran": "Frontend Developer"}. */
  specs: Record<string, string>
  /** Spesifikasi versi English (key sama dengan `specs`; kosong = pakai ID). */
  specs_en: Record<string, string>
  /** Blok konten fleksibel untuk layout builder (bagian 3). */
  content_blocks: ContentBlock[]
  /** Tombol aksi bebas (label + URL), tampil di atas halaman detail. */
  buttons: ProjectButton[]
  /** Label tombol CTA utama (tampil di atas judul halaman detail). */
  cta_label: string
  /** URL tujuan tombol CTA (kosong = tombol disembunyikan). */
  cta_url: string
  /** true = tampil di cuplikan beranda (bisa dipilih admin). */
  featured: boolean
  /** Penghitung view halaman detail — internal untuk admin, tidak tampil di publik. */
  view_count: number
  /** Versi English (Fitur bahasa) — kosong = fallback tampil versi ID. */
  title_en: string
  description_en: string
  full_description_en: string
  cta_label_en: string
  buttons_en: ProjectButton[]
  tags_en: string[]
  /** Thumbnail khusus beranda (opsional; kosong = pakai image_url). */
  thumbnail_url?: string
  /** Nama kategori (hasil join categories) — dipakai halaman detail. */
  category_name?: string
}

/**
 * Blok konten fleksibel untuk halaman detail project.
 * Disimpan sebagai JSON array di kolom `content_blocks`.
 */
export type ContentBlock =
  | {
      id: string
      type: 'image'
      src: string
      alt: string
      width: 'full' | 'wide' | 'half' | 'small'
    }
  | {
      id: string
      type: 'text'
      text: string
      width: 'full' | 'wide' | 'half' | 'small'
    }
  | {
      id: string
      type: 'image-text'
      src: string
      alt: string
      text: string
      /** Posisi gambar relatif teks. */
      position: 'left' | 'right'
    }

/** Struktur tabel `stats` di Supabase — section Statistik/Pencapaian. */
export interface Stat {
  id: string
  label: string
  value: number
  position: number
  visible: boolean
  created_at: string
  updated_at: string
}

/** Struktur tabel `proses` di Supabase — section Cara Kerja Saya. */
export interface Proses {
  id: string
  position: number
  icon: string
  description: string
  visible: boolean
  created_at: string
  updated_at: string
}

/**
 * Struktur tabel `messages` di Supabase — pesan dari form kontak.
 * RLS: siapa pun boleh INSERT, hanya admin boleh SELECT/UPDATE/DELETE
 * (lihat supabase/migration-v10.sql).
 */
export interface Message {
  id: number
  name: string
  email: string
  message: string
  is_read: boolean
  created_at: string
}

/**
 * Struktur tabel `achievements` di Supabase — sertifikat & pencapaian
 * (lihat supabase/migration-v11.sql).
 */
export interface Achievement {
  id: number
  title: string
  issuer: string
  /** Tahun (string supaya bisa "2024", "2023–2024", dll). */
  year: string
  /** Gambar sertifikat (opsional; kosong = kartu tanpa gambar). */
  image_url: string
  description: string
  /** Kategori pencapaian (opsional; null = tanpa kategori). */
  category_id: number | null
  position: number
  /** true = tampil di cuplikan beranda (bisa dipilih admin). */
  featured: boolean
  /** URL-friendly id untuk halaman detail (/achievements/:slug). */
  slug: string | null
  /** Cerita lengkap di halaman detail (terpisah dari deskripsi kartu). */
  full_description: string
  /** Versi English (Fitur bahasa) — kosong = fallback tampil versi ID. */
  title_en: string
  description_en: string
  full_description_en: string
  issuer_en: string
  /** Galeri foto di halaman detail (array URL). */
  gallery: string[]
  created_at: string
  updated_at: string
}

/** Struktur tabel `achievement_categories` di Supabase. */
export interface AchievementCategory {
  id: number
  name: string
  position: number
}

/** Zona tampil custom section (di antara section inti). */
export type CustomSectionZone =
  | 'after-about'
  | 'after-projects'
  | 'after-contact'

/** Layout blok custom section. */
export type CustomSectionLayout = 'text' | 'text-image'

/** Struktur tabel `custom_sections` di Supabase. */
export interface CustomSection {
  id: number
  zone: CustomSectionZone
  position: number
  visible: boolean
  layout: CustomSectionLayout
  title: string
  text: string
  image_url: string
  link_label: string
  link_url: string
  /** Versi English (Fitur bahasa) — kosong = fallback tampil versi ID. */
  title_en: string
  text_en: string
  link_label_en: string
  created_at: string
  updated_at: string
}
