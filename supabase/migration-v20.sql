-- ============================================================
--  MIGRASI V20 — VERSI ENGLISH (DUA BAHASA) UNTUK PERJALANAN
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Latar belakang:
--  Fitur bahasa (ID/EN) selama ini baru mencakup profile, projects,
--  achievements, dan custom_sections. Sekarang cerita perjalanan
--  (journey_entries) ikut dua bahasa — pola sama persis dengan tabel
--  lain: kolom `*_en` berdampingan dengan kolom aslinya, KOSONG =
--  fallback otomatis menampilkan versi Bahasa Indonesia (teks tidak
--  pernah jadi kosong di halaman berbahasa English).
--
--  Aman dijalankan berulang (idempotent). Tabel lain TIDAK tersentuh.
-- ============================================================

-- 1. Kolom English baru (default '' = belum diisi → fallback ke ID)
alter table public.journey_entries
  add column if not exists title_en      text not null default '',
  add column if not exists excerpt_en    text not null default '',
  add column if not exists full_story_en text not null default '';

comment on column public.journey_entries.title_en is
  'Versi English judul cerita. Kosong = halaman EN menampilkan versi Indonesia (fallback).';
comment on column public.journey_entries.excerpt_en is
  'Versi English cuplikan singkat di timeline. Kosong = fallback versi Indonesia.';
comment on column public.journey_entries.full_story_en is
  'Versi English cerita lengkap di halaman detail. Kosong = fallback versi Indonesia.';

-- 2. Tidak perlu backfill — kolom memang mulai kosong, dan fallback
--    di aplikasi (pick()) membuat entry lama tetap tampil normal
--    di kedua bahasa.

-- 3. Realtime sudah terpasang untuk tabel ini (migration v18) —
--    kolom baru ikut terkirim, tidak perlu langkah tambahan.

-- Selesai. Verifikasi:
--   select id, title, title_en, excerpt_en,
--          left(full_story_en, 40) as full_story_en
--   from public.journey_entries order by entry_date;
