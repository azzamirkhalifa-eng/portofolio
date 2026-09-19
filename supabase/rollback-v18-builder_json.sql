-- ============================================================
--  ROLLBACK MIGRASI V18 — HAPUS KOLOM builder_json
--  (pembatalan fitur visual page builder drag-and-drop)
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Langkah 1 (BACKUP): salin isi kolom ke tabel cadangan supaya
--  konten builder (bila ada) tidak hilang permanen dan masih bisa
--  diinspeksi/dipulihkan. Tabel _backup TIDAK diakses aplikasi.
--
--  Langkah 2 (DROP): hapus kolom builder_json dari tabel projects.
--
--  AMAN:
--   - Tidak menyentuh kolom lain (feature_items, buttons, dst utuh).
--   - RLS & realtime tidak perlu diubah.
--
--  PEMULIHAN (bila suatu saat diperlukan):
--   1. alter table public.projects add column builder_json jsonb;
--   2. update public.projects p
--      set builder_json = b.builder_json
--      from public._backup_builder_json_v18 b
--      where b.id = p.id
--        and b.builder_json is not null;
-- ============================================================

-- 1) BACKUP (aman dijalankan berulang — hanya dibuat bila belum ada)
create table if not exists public._backup_builder_json_v18 as
  select id, slug, builder_json, now() as backed_up_at
  from public.projects;

-- 2) HAPUS KOLOM
alter table public.projects
  drop column if exists builder_json;

-- Selesai. Verifikasi:
--   select column_name from information_schema.columns
--   where table_name = 'projects' and column_name = 'builder_json';
--   (harus 0 baris)
