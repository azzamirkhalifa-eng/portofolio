-- ============================================================
--  MIGRASI V18 — VISUAL PAGE BUILDER (PROTOTIPE: FEATURE PROJECT)
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Kolom baru `builder_json` (jsonb) di tabel projects — struktur
--      halaman builder: { version, elements: [...] }.
--      NULL = render publik fallback ke sistem lama (feature_items
--      zigzag / parsing full_description) — TIDAK mengubah tampilan
--      apa pun sampai admin benar-benar menyimpan dari builder.
--
--  AMAN & IDEMPOTENT:
--   - Tidak ada data lama yang diubah/dihapus.
--   - RLS tidak perlu diubah — kolom baru otomatis ikut policy
--     "public read projects" + "admin write projects" yang sudah ada.
--   - Realtime tidak perlu diubah (projects sudah di publication).
--   - Jalankan berulang kali: tidak ada efek samping.
--
--  ROLLBACK:  update public.projects set builder_json = null;
--  (atau drop kolom: alter table public.projects drop column builder_json;)
-- ============================================================

alter table public.projects
  add column if not exists builder_json jsonb;

-- Selesai. Verifikasi:
--   select slug, builder_json is not null as pakai_builder
--   from projects order by position;
