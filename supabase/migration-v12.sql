-- ============================================================
--  MIGRASI V12 — KATEGORI PENCAPAIAN
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur:
--   1. Tabel "achievement_categories" — kategori sertifikat/pencapaian
--   2. Kolom achievements.category_id (FK, on delete set null)
--   3. RLS: semua orang boleh BACA, hanya ADMIN boleh tulis
--   4. Realtime + index urutan
--
--  Catatan: tabel BARU + kolom BARU. Data lama tidak tersentuh.
--  Aman dijalankan berulang (idempotent).
-- ============================================================

-- 1. Tabel kategori pencapaian
create table if not exists public.achievement_categories (
  id       bigint generated always as identity primary key,
  name     text not null unique,
  position int  not null default 0
);

alter table public.achievement_categories enable row level security;

-- a) Semua orang boleh MEMBACA (tab filter tampil untuk pengunjung)
create policy "public read achievement_categories"
  on public.achievement_categories
  for select
  using (true);

-- b) Hanya admin yang boleh MENAMBAH/MENGEDIT/MENGHAPUS
create policy "admin write achievement_categories"
  on public.achievement_categories
  for all
  using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

-- 2. Kolom kategori di achievements.
--    Hapus kategori -> sertifikat otomatis jadi "tanpa kategori"
--    (on delete set null), datanya TIDAK ikut terhapus.
alter table public.achievements
  add column if not exists category_id bigint
  references public.achievement_categories (id) on delete set null;

-- 3. Realtime — perubahan kategori langsung muncul di semua browser
do $$
begin
  alter publication supabase_realtime add table public.achievement_categories;
exception when duplicate_object then null;
end $$;

-- 4. Index urutan tampil
create index if not exists achievement_categories_position_idx
  on public.achievement_categories (position asc);
