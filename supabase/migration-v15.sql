-- ============================================================
--  MIGRASI V15 — TOGGLE BAHASA INDONESIA / ENGLISH
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Kolom versi English (_en) untuk konten utama:
--      - profile    : tagline_en, about_title_en, about_text_en,
--                     hero_cta_text_en
--      - projects   : title_en, description_en, full_description_en
--      - achievements: title_en, description_en, full_description_en
--   2. Kolom lama TETAP jadi versi Bahasa Indonesia (tidak diubah/
--      di-rename) — data lama 100% aman.
--   3. Fallback: kalau kolom _en kosong (admin belum mengisi), situs
--      otomatis menampilkan versi Bahasa Indonesia (ditangani di kode).
--
--  Idempotent: aman dijalankan berulang kali.
-- ============================================================

-- 1. Kolom English di profile
alter table public.profile
  add column if not exists tagline_en        text not null default '',
  add column if not exists about_title_en    text not null default '',
  add column if not exists about_text_en     text not null default '',
  add column if not exists hero_cta_text_en  text not null default '';

-- 2. Kolom English di projects
alter table public.projects
  add column if not exists title_en             text not null default '',
  add column if not exists description_en       text not null default '',
  add column if not exists full_description_en  text not null default '';

-- 3. Kolom English di achievements
alter table public.achievements
  add column if not exists title_en            text not null default '',
  add column if not exists description_en      text not null default '',
  add column if not exists full_description_en text not null default '';

-- 4. Realtime — pastikan perubahan ter-broadcast (ADD, bukan SET)
do $$ begin
  alter publication supabase_realtime add table public.profile;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.achievements;
exception when duplicate_object then null; end $$;
