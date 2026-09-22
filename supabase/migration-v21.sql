-- ============================================================
--  MIGRASI V21 — VERSI ENGLISH (DUA BAHASA) UNTUK NAMA KATEGORI
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Latar belakang:
--  Kolom `*_en` sejak migration v15–v17 mencakup profil, projects,
--  achievements, dan custom_sections. Cerita perjalanan menyusul di
--  migration v20. Yang belum punya pasangan English adalah NAMA
--  KATEGORI (dipakai tombol filter & eyebrow halaman detail).
--
--  Migration ini menambahkan `name_en` ke KETIGA tabel kategori
--  sekaligus supaya konsisten (bukan hanya Perjalanan):
--    1. journey_categories    — kategori cerita perjalanan
--    2. categories            — kategori project
--    3. achievement_categories — kategori sertifikat/pencapaian
--
--  Pola sama persis dengan kolom `*_en` lain: KOSONG = fallback
--  otomatis menampilkan versi Bahasa Indonesia (teks tidak pernah
--  jadi kosong di halaman berbahasa English).
--
--  Aman dijalankan berulang (idempotent). Kolom lama TIDAK diubah
--  dan data yang sudah ada tidak terhapus.
-- ============================================================

-- 1. Kategori cerita perjalanan (Perjalanan)
alter table public.journey_categories
  add column if not exists name_en text not null default '';

comment on column public.journey_categories.name_en is
  'Versi English nama kategori perjalanan. Kosong = fallback ke versi Indonesia.';

-- 2. Kategori project
alter table public.categories
  add column if not exists name_en text not null default '';

comment on column public.categories.name_en is
  'Versi English nama kategori project. Kosong = fallback ke versi Indonesia.';

-- 3. Kategori sertifikat/pencapaian
alter table public.achievement_categories
  add column if not exists name_en text not null default '';

comment on column public.achievement_categories.name_en is
  'Versi English nama kategori pencapaian. Kosong = fallback ke versi Indonesia.';

-- Tidak perlu backfill: kolom memang mulai kosong, dan fallback di
-- aplikasi (pick()) membuat kategori lama tetap tampil normal di
-- kedua bahasa. Realtime sudah terpasang (migration v12/v13/v18) —
-- kolom baru ikut terkirim tanpa langkah tambahan.

-- Selesai. Verifikasi:
--   select id, name, name_en from public.journey_categories order by position;
--   select id, name, name_en from public.categories order by position;
--   select id, name, name_en from public.achievement_categories order by position;
