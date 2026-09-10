-- ============================================================
--  MIGRASI V13 — PENCAPAIAN LENGKAP (mirip projects)
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur:
--   1. featured  — admin pilih pencapaian yang tampil di BERANDA
--   2. slug      — alamat halaman detail /achievements/:slug
--   3. full_description — cerita lengkap di halaman detail
--   4. gallery   — galeri foto (sertifikat, momen, dll)
--
--  PERBAIKAN ERROR "record new has no field updated_at":
--   Tabel achievements di database kamu ternyata belum punya kolom
--   updated_at, padahal trigger touch_updated_at() mencoba mengisinya
--   setiap kali ada UPDATE (backfill slug). Bagian 0 di bawah
--   menambahkan kolomnya + membuat fungsi trigger jadi defensif.
--
--  Idempotent: aman dijalankan berulang kali. Data lama tidak tersentuh.
-- ============================================================

-- 0. GUARD: pastikan kolom updated_at ada di achievements.
--    Tanpa ini, UPDATE apapun ke tabel ini gagal dengan:
--    'record "new" has no field "updated_at"'
alter table public.achievements
  add column if not exists updated_at timestamptz not null default now();

-- 0b. Fungsi trigger dibuat defensif: hanya set updated_at kalau
--     kolomnya memang ada di tabel yang bersangkutan. Mencegah error
--     serupa pada tabel lain di masa depan.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = tg_table_schema
      and table_name  = tg_table_name
      and column_name = 'updated_at'
  ) then
    new.updated_at = now();
  end if;
  return new;
end $$;

-- 1. Kolom baru
alter table public.achievements
  add column if not exists featured boolean not null default true;
alter table public.achievements
  add column if not exists slug text unique;
alter table public.achievements
  add column if not exists full_description text not null default '';
alter table public.achievements
  add column if not exists gallery text[] not null default '{}';

-- 2. Backfill slug dari judul (baris yang belum punya slug)
update public.achievements
set slug = lower(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'),
        '^-+|-+$', '', 'g'
      )
    )
where slug is null and title <> '';

-- 3. Slug fallback unik untuk baris tanpa judul / slug bentrok
update public.achievements a
set slug = 'pencapaian-' || a.id
where a.slug is null;

-- 4. Realtime — pakai ADD (bukan SET!), supaya tabel lain tidak
--    terlempar keluar dari publication. Aman dijalankan berulang.
do $$ begin
  alter publication supabase_realtime add table public.profile;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.skills;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.categories;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.custom_sections;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.achievements;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.achievement_categories;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
