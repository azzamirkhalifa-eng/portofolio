-- ============================================================
--  MIGRASI V3 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Kolom detail project: slug (URL halaman detail),
--      full_description (deskripsi lengkap), gallery (array URL
--      screenshot), specs (JSON fleksibel key-value), dan
--      content_blocks (JSON array untuk layout builder).
--   2. Kolom featured — admin memilih project mana yang tampil
--      di cuplikan beranda ("pilih project yang ditampilkan").
--   3. Backfill slug unik otomatis dari judul project yang ada.
--
--  Aman: hanya ALTER/CREATE + UPDATE backfill — TIDAK ada
--  tabel/kolom yang di-drop, data lama tidak hilang.
-- ============================================================

-- ------------------------------------------------------------
-- 1. KOLOM DETAIL PROJECT
-- ------------------------------------------------------------
alter table public.projects
  add column if not exists slug text;

alter table public.projects
  add column if not exists full_description text not null default '';

alter table public.projects
  add column if not exists gallery text[] not null default '{}';

alter table public.projects
  add column if not exists specs jsonb not null default '{}';

alter table public.projects
  add column if not exists content_blocks jsonb not null default '[]';

-- ------------------------------------------------------------
-- 2. PILIHAN BERANDA (featured)
--    true  = tampil di cuplikan beranda
--    false = hanya tampil di halaman /projects
--    Default true supaya project lama tetap muncul.
-- ------------------------------------------------------------
alter table public.projects
  add column if not exists featured boolean not null default true;

-- ------------------------------------------------------------
-- 3. BACKFILL SLUG UNIK dari judul
--    slug = judul di-lowercase, spasi/karakter aneh → "-"
--    Kalau bentrok (judul mirip), ditambah angka di belakang
--    sampai unik. Project tanpa judul → "project-<id>".
-- ------------------------------------------------------------
do $$
declare
  r record;
  base text;
  candidate text;
  suffix int;
begin
  for r in
    select p.id,
           coalesce(
             nullif(
               regexp_replace(
                 regexp_replace(lower(trim(p.title)), '[^a-z0-9]+', '-', 'g'),
                 '(^-|-$)', '', 'g'
               ),
               ''
             ),
             'project'
           ) as base
    from public.projects p
    where p.slug is null or p.slug = ''
  loop
    base := r.base;
    candidate := base;
    suffix := 0;
    while exists (
      select 1 from public.projects
      where slug = candidate and id <> r.id
    ) loop
      suffix := suffix + 1;
      candidate := base || '-' || suffix;
    end loop;
    update public.projects set slug = candidate where id = r.id;
  end loop;
end $$;

-- Slug wajib terisi & unik (indeks untuk lookup cepat di halaman detail)
alter table public.projects alter column slug set not null;
create unique index if not exists projects_slug_idx on public.projects (slug);