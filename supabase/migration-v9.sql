-- ============================================================
--  MIGRASI V9 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur:
--   1. Ukuran teks per elemen (skala %, 100 = default tema):
--      hero_name, tagline, section_title, body, card_title, card_text
--   2. Bingkai foto gaya Canva (Hero & About, terpisah):
--      *_photo_shape  = 'rounded' | 'square' | 'arch' | 'circle'
--      *_photo_focus_x/y = titik fokus foto (0-100, seperti crop)
--   3. Thumbnail project (opsional; kosong = pakai foto utama)
--
--  Catatan: HANYA menambah kolom baru. Data yang sudah ada
--  TIDAK tersentuh. Default = tampilan sekarang.
-- ============================================================

-- 1. Skala tipografi per elemen (persen, 100 = ukuran default)
alter table public.profile
  add column if not exists hero_name_scale    int not null default 100;
alter table public.profile
  add column if not exists tagline_scale      int not null default 100;
alter table public.profile
  add column if not exists section_title_scale int not null default 100;
alter table public.profile
  add column if not exists body_scale         int not null default 100;
alter table public.profile
  add column if not exists card_title_scale   int not null default 100;
alter table public.profile
  add column if not exists card_text_scale    int not null default 100;

-- 2. Bingkai foto (Hero & About terpisah)
alter table public.profile
  add column if not exists hero_photo_shape  text not null default 'rounded';
alter table public.profile
  add column if not exists hero_photo_focus_x int not null default 50;
alter table public.profile
  add column if not exists hero_photo_focus_y int not null default 50;
alter table public.profile
  add column if not exists about_photo_shape text not null default 'rounded';
alter table public.profile
  add column if not exists about_photo_focus_x int not null default 50;
alter table public.profile
  add column if not exists about_photo_focus_y int not null default 50;

-- 3. Thumbnail project (kosong = fallback ke image_url)
alter table public.projects
  add column if not exists thumbnail_url text not null default '';
