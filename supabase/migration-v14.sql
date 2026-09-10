-- ============================================================
--  MIGRASI V14 — PENGHITUNG VIEW PER PROJECT
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur:
--   1. Kolom view_count di tabel projects (default 0, data lama aman)
--   2. Fungsi RPC increment_project_view() — pengunjung (anon, tanpa
--      login) bisa MENAMBAH view lewat RPC, TAPI tetap tidak bisa
--      UPDATE/SELECT/DELETE tabel projects langsung (RLS tetap rapat).
--
--  Idempotent: aman dijalankan berulang kali.
-- ============================================================

-- 1. Kolom view_count
alter table public.projects
  add column if not exists view_count int not null default 0;

-- 2. Fungsi RPC: tambah 1 view, atomik, kembalikan angka terbaru.
--    SECURITY DEFINER = dijalankan dengan hak pemilik tabel, jadi boleh
--    menulis view_count walau yang memanggil anon (RLS projects menutup
--    update langsung). Fungsi ini HANYA menambah counter — tidak bisa
--    dipakai membaca/mengubah data lain.
create or replace function public.increment_project_view(p_project_id bigint)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update public.projects
  set view_count = coalesce(view_count, 0) + 1
  where id = p_project_id
  returning view_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

-- 3. Pastikan semua role boleh MEMANGGIL fungsi ini (default Supabase
--    memang sudah begini — baris ini hanya menegaskan kembali).
grant execute on function public.increment_project_view(bigint) to anon, authenticated;
