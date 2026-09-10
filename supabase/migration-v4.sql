-- ============================================================
--  MIGRASI V4 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Kolom `buttons` (jsonb) di tabel projects — daftar tombol
--      aksi bebas yang tampil di atas halaman detail project.
--      Setiap tombol: { id, label, url }. Admin bisa tambah/hapus
--      berapa pun lewat Mode Edit / dashboard.
--   2. Backfill otomatis: link Live Demo & GitHub yang lama
--      menjadi 2 tombol awal, jadi tidak ada data yang hilang.
--
--  Aman: hanya ALTER + UPDATE backfill — TIDAK ada tabel/kolom
--  yang di-drop, data lama tidak hilang. Kolom demo_url dan
--  github_url lama sengaja TIDAK dihapus (cadangan), hanya tidak
--  dipakai lagi oleh website.
-- ============================================================

-- ------------------------------------------------------------
-- 1. KOLOM TOMBOL AKSI (daftar bebas, tampil di halaman detail)
--    Contoh isi: [{"id":"demo","label":"Live Demo","url":"https://..."},
--                 {"id":"gh","label":"GitHub","url":"https://..."}]
-- ------------------------------------------------------------
alter table public.projects
  add column if not exists buttons jsonb not null default '[]';

-- ------------------------------------------------------------
-- 2. BACKFILL dari kolom lama demo_url & github_url
--    Project yang belum punya tombol sama sekali → dibuatkan
--    tombol "Live Demo" dan/atau "GitHub" dari link yang sudah ada.
--    Project yang sudah punya tombol dibiarkan (tidak ditimpa).
-- ------------------------------------------------------------
do $$
declare
  r record;
  arr jsonb := '[]';
begin
  for r in
    select p.id, p.demo_url, p.github_url
    from public.projects p
    where jsonb_array_length(p.buttons) = 0
  loop
    arr := '[]';
    if r.demo_url is not null and r.demo_url <> '' then
      arr := arr || jsonb_build_object(
        'id',    'demo',
        'label', 'Live Demo',
        'url',   r.demo_url
      );
    end if;
    if r.github_url is not null and r.github_url <> '' then
      arr := arr || jsonb_build_object(
        'id',    'github',
        'label', 'GitHub',
        'url',   r.github_url
      );
    end if;
    update public.projects set buttons = arr where id = r.id;
  end loop;
end $$;
