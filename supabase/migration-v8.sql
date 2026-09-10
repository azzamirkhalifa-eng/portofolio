-- ============================================================
--  MIGRASI V8 — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur: admin bisa mengatur UKURAN foto (lebar & tinggi)
--  untuk dua foto secara terpisah:
--   1. Foto Hero  (kolom kanan Hero Section)
--   2. Foto Kartu About (ProfileCard)
--
--  Satuan: PIKSEL (px) = ukuran MAKSIMUM tampilan foto.
--  Layout tetap responsif — di layar kecil foto otomatis
--  menyusut (max-width: 100%), jadi aman untuk mobile.
--
--  Catatan: HANYA menambah kolom baru (ALTER TABLE ... ADD
--  COLUMN IF NOT EXISTS). Data yang sudah ada TIDAK tersentuh.
-- ============================================================

alter table public.profile
  add column if not exists hero_photo_width  int not null default 420;
alter table public.profile
  add column if not exists hero_photo_height int not null default 520;
alter table public.profile
  add column if not exists about_photo_width  int not null default 340;
alter table public.profile
  add column if not exists about_photo_height int not null default 420;

-- Nilai default di atas = ukuran yang sudah dipakai halaman
-- sekarang (Hero ~420x520, kartu About ~340x420), jadi tampilan
-- TIDAK berubah sama sekali sampai admin mengaturnya lewat slider.
