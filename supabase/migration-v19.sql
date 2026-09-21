-- ============================================================
--  MIGRASI V19 — FOTO UTAMA (HERO) TERPISAH DARI GALERI
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Latar belakang:
--  Sebelumnya foto pertama galeri dipakai dobel — jadi hero besar
--  di atas halaman detail DAN thumbnail timeline. Sekarang dipisah
--  (pola sama dengan tabel projects yang punya image_url TERPISAH
--  dari gallery):
--   - hero_image    → foto utama: tampil BESAR di atas halaman
--                     detail + thumbnail kartu di timeline.
--   - gallery_images→ foto-foto galeri di bawah cerita saja.
--
--  Aman dijalankan berulang (idempotent). Tabel lain TIDAK tersentuh.
-- ============================================================

-- 1. Kolom baru (kosong = halaman detail tanpa hero, seperti sebelumnya
--    untuk entry tanpa foto)
alter table public.journey_entries
  add column if not exists hero_image text not null default '';

-- 2. Backfill sekali: entry lama yang mengandalkan "foto pertama
--    galeri = hero" tetap tampil persis seperti sebelum migrasi.
update public.journey_entries
set hero_image = gallery_images ->> 0
where hero_image = ''
  and jsonb_typeof(gallery_images) = 'array'
  and jsonb_array_length(gallery_images) > 0;

comment on column public.journey_entries.hero_image is
  'Foto utama: hero besar di atas halaman detail + thumbnail timeline. Terpisah dari gallery_images (pola image_url vs gallery di tabel projects).';

-- 3. Realtime sudah terpasang untuk tabel ini (migration v18) —
--    kolom baru ikut terkirim, tidak perlu langkah tambahan.

-- Selesai. Verifikasi:
--   select id, title, hero_image, jsonb_array_length(gallery_images) as galeri
--   from public.journey_entries order by entry_date;
