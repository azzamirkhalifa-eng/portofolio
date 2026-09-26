-- ============================================================
--  MIGRASI V23 — ANTI-SPAM FORM KONTAK (SERVER-SIDE)
--  Jalankan di Supabase SQL Editor, SETELAH migration-v22.
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Latar belakang:
--  Rate limit form kontak saat ini hanya berjalan di KLIEN
--  (src/lib/contactThrottle.ts, timestamp di localStorage). Pembatas itu
--  mencegah klik ganda dari UI, TAPI bisa dilewati siapa pun yang memanggil
--  PostgREST / anon key langsung dari luar browser.
--
--  Migrasi ini menambahkan jaring pengaman di SISI DATABASE:
--    1. Rate limit nyata: 1 pesan per email per 60 detik. Ditegakkan oleh
--       trigger BEFORE INSERT, jadi tidak bisa dilewati dari klien.
--    2. Kolom yang dikendalikan server dipaksa saat INSERT
--       (created_at = now(), is_read = false) supaya anon tidak bisa
--       memalsukan waktu kirim atau menandai pesannya sendiri "sudah dibaca".
--
--  Catatan: trigger hanya berlaku untuk INSERT dari pengunjung. Admin tidak
--  pernah meng-INSERT ke tabel messages (hanya baca/update/hapus), jadi alur
--  admin tidak terpengaruh sama sekali.
--
--  Aman dijalankan berulang (idempotent). Tabel/data lain tidak tersentuh.
-- ============================================================

-- ============================================================
-- 1. Fungsi trigger anti-spam + penegak kolom server
--    SECURITY DEFINER supaya bisa menghitung pesan dari email yang sama
--    walau anon TIDAK punya hak SELECT ke tabel messages (RLS tetap rapat).
--    search_path dikunci ke public + pg_temp untuk mencegah pembajakan
--    objek lewat search_path.
-- ============================================================
create or replace function public.messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- (a) Paksa nilai yang hanya boleh ditentukan server.
  new.created_at := now();
  new.is_read    := false;

  -- (b) Rate limit: tolak bila email yang sama sudah mengirim dalam 60 detik.
  --     Email dibandingkan case-insensitive dan tanpa spasi tepi.
  if exists (
    select 1
      from public.messages m
     where lower(btrim(m.email)) = lower(btrim(new.email))
       and m.created_at > now() - interval '60 seconds'
  ) then
    raise exception 'MESSAGE_RATE_LIMITED'
      using errcode = 'check_violation',
            hint = 'Mohon tunggu sebentar sebelum mengirim pesan lagi.';
  end if;

  return new;
end;
$$;

-- ============================================================
-- 2. Pasang trigger (ganti kalau sudah ada)
-- ============================================================
drop trigger if exists trg_messages_before_insert on public.messages;
create trigger trg_messages_before_insert
  before insert on public.messages
  for each row execute function public.messages_before_insert();

-- Batasi siapa saja yang boleh memanggil fungsi trigger secara langsung.
-- (Trigger tetap jalan walau EXECUTE dicabut — eksekusi lewat trigger bukan
--  pemanggilan izin grantee biasa.)
revoke all on function public.messages_before_insert() from public, anon, authenticated;

-- ============================================================
-- 3. Verifikasi cepat setelah dijalankan
-- ============================================================
-- Trigger terpasang:
--   select tgname from pg_trigger
--    where tgrelid = 'public.messages'::regclass and not tgisinternal;
--
-- Uji rate limit (jalankan cepat dua kali — yang kedua HARUS gagal
-- dengan error "MESSAGE_RATE_LIMITED"):
--   insert into public.messages (name, email, message)
--   values ('Tes', 'tes@example.com', 'Pesan pertama');
--   insert into public.messages (name, email, message)
--   values ('Tes', 'tes@example.com', 'Pesan kedua');   -- <- ditolak
