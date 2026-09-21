-- ============================================================
--  MIGRASI V18 — HALAMAN "PERJALANAN" (TIMELINE CERITA)
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur:
--   1. Tabel "journey_categories" — kategori cerita, TERPISAH dari
--      kategori project (categories) & kategori pencapaian
--      (achievement_categories) supaya tidak tercampur.
--   2. Tabel "journey_entries" — cerita perjalanan
--      (title, entry_date, category_id, excerpt, full_story,
--       gallery_images, slug).
--   3. RLS: semua orang boleh BACA (halaman publik),
--      hanya ADMIN boleh tambah/edit/hapus.
--   4. Trigger updated_at + realtime (auto-update di browser).
--   5. Index entry_date (urutan timeline kronologis) + slug unique.
--   6. Seed: 3 kategori + 3 cerita CONTOH (dummy) — silakan hapus
--      lewat dashboard admin (tab Perjalanan) setelah fitur jalan.
--
--  Catatan: tabel BARU. Tabel/data fitur lain TIDAK tersentuh.
--  Aman dijalankan berulang kali (idempotent).
-- ============================================================

-- 1. Tabel journey_categories (dibuat dulu — jadi referensi FK)
create table if not exists public.journey_categories (
  id       bigint generated always as identity primary key,
  name     text not null unique,
  position int  not null default 0
);

-- 2. Tabel journey_entries
create table if not exists public.journey_entries (
  id             bigint generated always as identity primary key,
  title          text not null,
  -- Tanggal/bulan-tahun kejadian — urutan timeline otomatis dari sini
  -- (input bebas "YYYY-MM-DD" atau "YYYY-MM"; dibaca frontend).
  entry_date     date not null default '2026-01-01',
  category_id    bigint references public.journey_categories (id)
                 on delete set null,
  excerpt        text not null default '',
  full_story     text not null default '',
  -- Array URL gambar galeri (jsonb) — boleh kosong / lebih dari 1
  gallery_images jsonb not null default '[]',
  -- URL-friendly id untuk halaman detail (/perjalanan/:slug)
  slug           text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 3. Row Level Security
alter table public.journey_categories enable row level security;
alter table public.journey_entries    enable row level security;

-- a) Semua orang boleh MEMBACA (halaman publik)
drop policy if exists "public read journey_categories" on public.journey_categories;
create policy "public read journey_categories"
  on public.journey_categories
  for select
  using (true);

drop policy if exists "public read journey_entries" on public.journey_entries;
create policy "public read journey_entries"
  on public.journey_entries
  for select
  using (true);

-- b) Hanya admin yang boleh MENULIS (tambah/edit/hapus)
drop policy if exists "admin write journey_categories" on public.journey_categories;
create policy "admin write journey_categories"
  on public.journey_categories
  for all
  using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

drop policy if exists "admin write journey_entries" on public.journey_entries;
create policy "admin write journey_entries"
  on public.journey_entries
  for all
  using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

-- 4. Trigger updated_at (pola sama dengan tabel lain)
drop trigger if exists trg_journey_categories_updated_at on public.journey_categories;
create trigger trg_journey_categories_updated_at before update on public.journey_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_journey_entries_updated_at on public.journey_entries;
create trigger trg_journey_entries_updated_at before update on public.journey_entries
  for each row execute function public.touch_updated_at();

-- 5. Realtime — perubahan langsung muncul di semua browser
do $$
begin
  alter publication supabase_realtime add table public.journey_categories;
  alter publication supabase_realtime add table public.journey_entries;
exception when duplicate_object then null;
end $$;

-- 6. Index: urutan timeline (entry_date) & pencarian slug
create index if not exists journey_entries_entry_date_idx
  on public.journey_entries (entry_date asc);
create index if not exists journey_categories_position_idx
  on public.journey_categories (position asc);

-- 7. SEED — kategori CONTOH (bisa diedit/hapus lewat dashboard)
insert into public.journey_categories (name, position) values
  ('Pendidikan', 1),
  ('Pengalaman', 2),
  ('Project',    3)
on conflict (name) do nothing;

-- 8. SEED — 3 cerita CONTOH (dummy) untuk melihat tampilan timeline.
--    Hapus/ubah lewat dashboard admin (tab Perjalanan) kapan saja.
insert into public.journey_entries
  (title, entry_date, category_id, excerpt, full_story, slug)
values
  ('Memulai Perjalanan di Dunia Kode', '2023-01-15',
   (select id from public.journey_categories where name = 'Pendidikan'),
   'Awal mula segalanya — baris kode pertama yang saya tulis dan alasan saya jatuh cinta pada programming.',
   'Cerita lengkap dummy: Semua dimulai dari rasa penasaran. Saya membuka editor pertama kali tanpa tahu apa-apa, dan ternyata itu menjadi titik balik. Dari HTML sederhana hingga aplikasi full-stack, setiap baris kode mengajarkan sesuatu yang baru.',
   'memulai-perjalanan-di-dunia-kode'),

  ('Menyelesaikan Project Pertama', '2024-06-20',
   (select id from public.journey_categories where name = 'Project'),
   'Project pertama yang benar-benar rilis — lengkap dengan drama deadline dan rasa lega.',
   'Cerita lengkap dummy: Project pertama selalu paling berkesan. Bug bermunculan, deadline mendekat, tapi begitu aplikasi online untuk pertama kali, semua lelah terbayar. Di sini saya belajar bahwa menyelesaikan jauh lebih sulit (dan lebih penting) daripada memulai.',
   'menyelesaikan-project-pertama'),

  ('Bergabung dengan Tim Developer', '2025-09-01',
   (select id from public.journey_categories where name = 'Pengalaman'),
   'Dari coding sendirian ke bekerja dalam tim — babak baru yang penuh pembelajaran.',
   'Cerita lengkap dummy: Bekerja dalam tim mengubah cara saya memandang kode. Code review, standar penulisan, komunikasi — semua adalah skill baru di luar sekadar menulis program. Perjalanan ini masih berlanjut, dan titik inilah "kamu di sini sekarang".',
   'bergabung-dengan-tim-developer')
on conflict (slug) do nothing;

-- Selesai. Verifikasi:
--   select count(*) from public.journey_entries;
--   select count(*) from public.journey_categories;
