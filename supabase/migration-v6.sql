-- ============================================================
--  MIGRASI V6 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Kolom `proficiency` (int 0-100) di tabel skills —
--      persentase penguasaan skill, ditampilkan sebagai
--      progress bar di section About.
--   2. Backfill: skill yang sudah ada diberi nilai awal 75
--      (admin bisa mengubahnya kapan saja lewat Mode Edit).
--
--  Aman: hanya ALTER + UPDATE backfill — TIDAK ada tabel/kolom
--  yang di-drop, data lama tidak hilang.
-- ============================================================

-- ------------------------------------------------------------
-- 1. KOLOM PROFICIENCY (0-100)
-- ------------------------------------------------------------
alter table public.skills
  add column if not exists proficiency int not null default 0
  check (proficiency between 0 and 100);

-- ------------------------------------------------------------
-- 2. BACKFILL — skill yang sudah ada diberi nilai awal 75
-- ------------------------------------------------------------
update public.skills
  set proficiency = 75
  where proficiency = 0;