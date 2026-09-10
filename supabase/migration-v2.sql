-- ============================================================
--  MIGRASI V2 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Tabel categories + relasi category_id di projects
--   2. Foto About terpisah dari foto Hero (about_avatar_url)
--   3. Posisi foto About (kiri/kanan) & jumlah kolom grid Projects
--   4. Tabel custom_sections (blok konten tambahan di 3 zona)
--
--  Aman: hanya CREATE/ALTER — TIDAK ada tabel/kolom yang di-drop.
-- ============================================================

-- ============================================================
-- 1. KATEGORI PROJECT
-- ============================================================
create table if not exists public.categories (
  id        bigint generated always as identity primary key,
  name      text not null unique,
  position  int  not null default 0
);

alter table public.projects
  add column if not exists category_id bigint
  references public.categories (id) on delete set null;

create index if not exists projects_category_id_idx
  on public.projects (category_id);

-- ============================================================
-- 2. & 3. KOLOM BARU DI TABEL profile
-- ============================================================
alter table public.profile
  add column if not exists about_avatar_url text not null default '';

alter table public.profile
  add column if not exists about_photo_side text not null default 'left'
  check (about_photo_side in ('left', 'right'));

alter table public.profile
  add column if not exists projects_columns int not null default 2
  check (projects_columns between 1 and 3);

-- ============================================================
-- 4. CUSTOM SECTIONS — blok konten tambahan
--    zone: di mana blok tampil; layout: text / text-image
-- ============================================================
create table if not exists public.custom_sections (
  id          bigint generated always as identity primary key,
  zone        text not null default 'after-projects'
              check (zone in ('after-about', 'after-projects', 'after-contact')),
  position    int  not null default 0,
  visible     boolean not null default true,
  layout      text not null default 'text'
              check (layout in ('text', 'text-image')),
  title       text not null default '',
  text        text not null default '',
  image_url   text not null default '',
  link_label  text not null default '',
  link_url    text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger auto-update updated_at (fungsi sudah dibuat di schema awal)
drop trigger if exists trg_custom_sections_updated_at on public.custom_sections;
create trigger trg_custom_sections_updated_at before update
  on public.custom_sections for each row execute function public.touch_updated_at();

-- ============================================================
-- RLS — publik boleh baca, hanya admin email yang boleh tulis
-- ============================================================
alter table public.categories      enable row level security;
alter table public.custom_sections enable row level security;

create policy "public read categories"
  on public.categories for select using (true);
create policy "public read custom_sections"
  on public.custom_sections for select using (true);

create policy "admin write categories" on public.categories
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

create policy "admin write custom_sections" on public.custom_sections
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

-- ============================================================
-- REALTIME — perubahan ikut auto-update halaman publik
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.categories;
  alter publication supabase_realtime add table public.custom_sections;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- SEED kategori default (bisa diedit/tambah lewat Mode Edit)
-- ============================================================
insert into public.categories (name, position) values
  ('Web App',    1),
  ('Web Design', 2),
  ('UI/UX',      3),
  ('Mobile App', 4),
  ('Design',     5)
on conflict (name) do nothing;
