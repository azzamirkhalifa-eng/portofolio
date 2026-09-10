-- ============================================================
--  MIGRASI V11 — SECTION SERTIFIKAT & PENCAPAIAN
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur:
--   1. Tabel "achievements" — sertifikat/pencapaian
--      (id, title, issuer, year, image_url, description, position)
--   2. RLS: semua orang boleh BACA (halaman publik),
--      hanya ADMIN boleh tambah/edit/hapus
--   3. Trigger updated_at + realtime (auto-update di browser)
--   4. Index position untuk urutan tampil
--
--  Catatan: tabel BARU. Data lama tidak tersentuh.
-- ============================================================

-- 1. Tabel achievements
create table if not exists public.achievements (
  id          bigint generated always as identity primary key,
  title       text not null,
  issuer      text not null default '',
  year        text not null default '',
  image_url   text not null default '',
  description text not null default '',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Row Level Security
--    Catatan: CREATE POLICY tidak punya "if not exists" di PostgreSQL,
--    jadi tiap policy di-DROP dulu supaya script ini AMAN dijalankan
--    berulang kali (idempotent).
alter table public.achievements enable row level security;

-- a) Semua orang boleh MEMBACA (section tampil untuk pengunjung)
drop policy if exists "public read achievements" on public.achievements;
create policy "public read achievements"
  on public.achievements
  for select
  using (true);

-- b) Hanya admin yang boleh MENAMBAH
drop policy if exists "admin insert achievements" on public.achievements;
create policy "admin insert achievements"
  on public.achievements
  for insert
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

-- c) Hanya admin yang bisa MENGEDIT
drop policy if exists "admin update achievements" on public.achievements;
create policy "admin update achievements"
  on public.achievements
  for update
  using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

-- d) Hanya admin yang bisa MENGHAPUS
drop policy if exists "admin delete achievements" on public.achievements;
create policy "admin delete achievements"
  on public.achievements
  for delete
  using (auth.email() = 'azzamirkhalifa@gmail.com');

-- 3. Trigger updated_at (pola sama dengan tabel lain)
drop trigger if exists trg_achievements_updated_at on public.achievements;
create trigger trg_achievements_updated_at before update on public.achievements
  for each row execute function public.touch_updated_at();

-- 4. Realtime — perubahan langsung muncul di semua browser
do $$
begin
  alter publication supabase_realtime add table public.achievements;
exception when duplicate_object then null;
end $$;

-- 5. Index urutan tampil
create index if not exists achievements_position_idx
  on public.achievements (position asc);
