-- ============================================================
--  MIGRASI V7 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Tabel baru:
--   1. `stats`       -> menampilkan angka besar dengan animasi count-up
--      (contoh: jumlah project selesai, tools dikuasai, lama berkarya)
--   2. `proses`      -> menampilkan 3-4 langkah kerja (Riset > Desain > Bangun > Deploy)
--      setiap langkah punya ikon dan deskripsi singkat
--
--  Cara mengelola keduanya lewat Mode Edit (Admin):
--   - Menambah/ mengurangi angka dan label (section Stats)
--   - Menambah/ mengubah urutan & ikon langkah (section Proses)
--
--  Catatan: migrasi ini HANYA menambah tabel baru.
--  Tabel/tap data yang sudah ada (profile, skills, projects) TIDAK ikut
--  terpengaruh atau ter-drop.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABEL: stats (section Statistik/Pencapaian)
-- ------------------------------------------------------------
create table if not exists public.stats (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  -- Label tampil di layar (mis. "Project Selesai")
  label text not null,
  -- Nilai angka yang akan di-animasi count-up (mis. 24)
  value int not null default 0,
  -- Urutan tampil di section (1, 2, 3...)
  position int not null default 0,
  -- Aktif/tidak aktif tampil di halaman utama
  visible boolean not null default true
);

-- ------------------------------------------------------------
-- 2. TABEL: proses (section Cara Kerja Saya)
-- ------------------------------------------------------------
create table if not exists public.proses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  -- Urutan tampil (1, 2, 3, 4)
  position int not null default 0,
  -- Ikon kecil (mis. "riquet", "desain", "bangun", "deploy")
  -- Simpan nama ikon atau kode SVG/emoji
  icon varchar not null default '',
  -- Deskripsi singkat per langkah
  description text not null,
  -- Aktif/tidak aktif tampil di halaman utama
  visible boolean not null default true
);

-- ------------------------------------------------------------
-- 3. VIEW ringkas untuk memudahkan query di komponen frontend
-- ------------------------------------------------------------
create or replace view public.stats_view as
select id, label, value, position, visible
from public.stats
order by position asc;

create or replace view public.proses_view as
select id, position, icon, description, visible
from public.proses
order by position asc;