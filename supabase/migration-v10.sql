-- ============================================================
--  MIGRASI V10 — FORM KONTAK (tabel messages)
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Fitur:
--   1. Tabel "messages" — pesan dari form kontak
--      (id, name, email, message, created_at, is_read)
--   2. RLS: SIAPAPUN boleh INSERT (form kontak publik),
--      hanya ADMIN yang boleh baca / tandai dibaca / hapus
--   3. Realtime: pesan baru muncul otomatis di dashboard
--   4. Index created_at untuk urutan terbaru
--
--  Catatan: tabel BARU. Data lama tidak tersentuh.
-- ============================================================

-- 1. Tabel messages
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Row Level Security
alter table public.messages enable row level security;

-- a) SIAPAPUN (termasuk pengunjung tanpa login) boleh mengirim pesan baru.
--    Anon TIDAK punya SELECT/UPDATE/DELETE sama sekali.
create policy "public insert messages"
  on public.messages
  for insert
  to anon, authenticated
  with check (true);

-- b) Hanya admin yang bisa MEMBACA pesan masuk
create policy "admin read messages"
  on public.messages
  for select
  using (auth.email() = 'azzamirkhalifa@gmail.com');

-- c) Hanya admin yang bisa menandai pesan sudah dibaca (UPDATE is_read)
create policy "admin update messages"
  on public.messages
  for update
  using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

-- d) Hanya admin yang bisa MENGHAPUS pesan
create policy "admin delete messages"
  on public.messages
  for delete
  using (auth.email() = 'azzamirkhalifa@gmail.com');

-- 3. Realtime — pesan baru muncul otomatis di tab "Pesan Masuk"
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- 4. Index untuk sorting "terbaru dulu"
create index if not exists messages_created_at_idx
  on public.messages (created_at desc);
