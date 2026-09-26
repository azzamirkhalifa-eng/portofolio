-- ============================================================
--  MIGRASI V22 — SECURITY HARDENING (RLS + VALIDASI INPUT)
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Latar belakang (hasil audit):
--   1. Tabel `stats` dan `proses` (dibuat di migration-v7) TIDAK PERNAH
--      mengaktifkan RLS — siapa pun yang punya anon key bisa INSERT/UPDATE/
--      DELETE. Ini celah paling jelas.
--   2. View `stats_view` / `proses_view` dimiliki role postgres sehingga
--      melewati (bypass) RLS saat dibaca publik. Diperbaiki dengan
--      `security_invoker`.
--   3. Tabel `messages` (form kontak publik) hanya divalidasi di frontend.
--      Ditambah CHECK constraint di level database supaya tidak bisa
--      dilewati dengan memanggil PostgREST langsung.
--
--  Catatan: migrasi ini TIDAK mengubah tabel/data fitur lain, dan aman
--  dijalankan berulang (idempotent). Setelah dijalankan, admin tetap bisa
--  mengelola semua konten lewat dashboard (policy admin memakai email JWT).
-- ============================================================

-- ============================================================
-- 1. TABEL stats & proses — aktifkan RLS
--    ADMIN SAJA (least privilege): tabel ini tidak lagi dirender untuk
--    pengunjung, jadi TIDAK ada policy SELECT publik. Hanya admin yang
--    bisa baca/tulis lewat satu policy "for all" di bawah.
-- ============================================================
alter table if exists public.stats  enable row level security;
alter table if exists public.proses enable row level security;

-- Pastikan tidak ada sisa policy baca publik dari percobaan sebelumnya.
drop policy if exists "public read stats"  on public.stats;
drop policy if exists "public read proses" on public.proses;

-- Hanya admin yang boleh baca/tambah/edit/hapus.
-- Memakai (auth.jwt() ->> 'email') karena auth.email() sudah deprecated.
drop policy if exists "admin write stats" on public.stats;
create policy "admin write stats"
  on public.stats
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'azzamirkhalifa@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'azzamirkhalifa@gmail.com');

drop policy if exists "admin write proses" on public.proses;
create policy "admin write proses"
  on public.proses
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'azzamirkhalifa@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'azzamirkhalifa@gmail.com');

-- ============================================================
-- 2. TABEL messages — validasi input di level database
--    Form kontak boleh INSERT (siapa pun), tapi data yang masuk wajib
--    sesuai batas wajar. CHECK constraint tidak bisa dilewati frontend.
-- ============================================================
alter table public.messages drop constraint if exists messages_name_len;
alter table public.messages add constraint messages_name_len
  check (char_length(btrim(name)) between 1 and 100);

alter table public.messages drop constraint if exists messages_email_len;
alter table public.messages add constraint messages_email_len
  check (char_length(btrim(email)) between 3 and 200);

alter table public.messages drop constraint if exists messages_email_format;
alter table public.messages add constraint messages_email_format
  check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

alter table public.messages drop constraint if exists messages_message_len;
alter table public.messages add constraint messages_message_len
  check (char_length(btrim(message)) between 1 and 2000);

-- Perketat policy INSERT publik: pengunjung tidak boleh menandai pesannya
-- sendiri sebagai "sudah dibaca" (is_read) — itu hak admin.
drop policy if exists "public insert messages" on public.messages;
create policy "public insert messages"
  on public.messages
  for insert
  to anon, authenticated
  with check (is_read = false);

-- ============================================================
-- 3. VIEW stats_view & proses_view — patuhi RLS
--    Tanpa security_invoker, view milik postgres melewati RLS pemanggil.
--    (Butuh PostgreSQL 15+; Supabase memakai 15+.)
-- ============================================================
do $$
begin
  if exists (
    select 1 from pg_views where schemaname = 'public' and viewname = 'stats_view'
  ) then
    execute 'alter view public.stats_view set (security_invoker = true)';
  end if;

  if exists (
    select 1 from pg_views where schemaname = 'public' and viewname = 'proses_view'
  ) then
    execute 'alter view public.proses_view set (security_invoker = true)';
  end if;
end $$;

-- ============================================================
-- 4. Verifikasi cepat setelah dijalankan
-- ============================================================
-- select tablename, rowsecurity
--   from pg_tables where schemaname = 'public' order by tablename;
-- select tablename, policyname, cmd, roles
--   from pg_policies where schemaname = 'public' order by tablename, policyname;
