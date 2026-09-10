-- ============================================================
--  MIGRASI V5 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Kolom `cta_label` (text) & `cta_url` (text) di tabel
--      projects — tombol CTA utama yang tampil DI ATAS judul
--      di halaman detail project (urutan: breadcrumb "Kembali"
--      > tombol CTA > kategori > judul > deskripsi).
--   2. Backfill otomatis untuk project yang belum punya CTA:
--      diambil dari tombol pertama yang punya URL di kolom
--      `buttons`, atau fallback ke link Live Demo / GitHub lama.
--
--  Aman: hanya ALTER + UPDATE backfill — TIDAK ada tabel/kolom
--  yang di-drop, data lama tidak hilang.
-- ============================================================

-- ------------------------------------------------------------
-- 1. KOLOM TOMBOL CTA
--    cta_url kosong = tombol tidak ditampilkan untuk pengunjung.
-- ------------------------------------------------------------
alter table public.projects
  add column if not exists cta_label text not null default '';

alter table public.projects
  add column if not exists cta_url text not null default '';

-- ------------------------------------------------------------
-- 2. BACKFILL — isi CTA dari data yang sudah ada
--    Prioritas:
--      a. Tombol pertama (urutan) di kolom `buttons` yang punya URL
--      b. Link Live Demo lama (demo_url)
--      c. Link GitHub lama (github_url)
--    Project yang sudah punya CTA dibiarkan (tidak ditimpa).
-- ------------------------------------------------------------
do $$
declare
  r record;
  b jsonb;
  i int;
  lbl text;
  url text;
begin
  for r in
    select p.id, p.buttons, p.demo_url, p.github_url
    from public.projects p
    where coalesce(p.cta_label, '') = '' and coalesce(p.cta_url, '') = ''
  loop
    lbl := '';
    url := '';

    -- a. tombol pertama yang punya URL di kolom buttons
    if jsonb_typeof(r.buttons) = 'array' then
      for i in 0 .. jsonb_array_length(r.buttons) - 1 loop
        b := r.buttons->i;
        if coalesce(b->>'url', '') <> '' then
          lbl := coalesce(b->>'label', '');
          url := b->>'url';
          exit;
        end if;
      end loop;
    end if;

    -- b/c. fallback link lama
    if url = '' and coalesce(r.demo_url, '') <> '' then
      lbl := 'Live Demo';
      url := r.demo_url;
    elsif url = '' and coalesce(r.github_url, '') <> '' then
      lbl := 'GitHub';
      url := r.github_url;
    end if;

    update public.projects
      set cta_label = lbl, cta_url = url
      where id = r.id;
  end loop;
end $$;