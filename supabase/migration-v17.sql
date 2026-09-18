-- ============================================================
--  MIGRASI V17 — FEATURE ITEMS (POIN FITUR + GAMBAR PENDUKUNG)
--  Jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--
--  Isi:
--   1. Kolom baru `feature_items` (jsonb array) di tabel projects.
--      Setiap item: { id, title, title_en, text, text_en, image_url }.
--      Kosong ('[]') = render publik fallback ke parsing
--      full_description seperti sebelumnya.
--   2. Auto-migrasi data lama: full_description yang berpola
--      "1. ... 2. ..." dipecah otomatis menjadi feature_items
--      (tanpa gambar — gambar lama belum terasosiasi ke poin).
--      - Paragraf pembuka TIDAK ikut (tetap hidup di full_description
--        dan tampil sebagai intro di hero).
--      - Baris lanjutan (bukan nomor) setelah sebuah poin digabung
--        ke teks poin tersebut.
--      - full_description_en diproses sama ke text_en (per indeks).
--
--  AMAN & IDEMPOTENT:
--   - full_description / full_description_en TIDAK pernah diubah
--     (tetap jadi fallback + sumber rekonstruksi).
--   - Hanya project dengan feature_items = '[]' yang diisi.
--   - Jalankan berulang kali: tidak ada efek samping.
-- ============================================================

-- 1. Kolom baru
alter table public.projects
  add column if not exists feature_items jsonb not null default '[]';

-- 2. Function parser: pecah teks deskripsi menjadi array jsonb
--    feature_items. Pola baris bernomor SAMA dengan parser RichText
--    di frontend: ^\s*(\d{1,3})[.)]\s+
create or replace function public.split_feature_items(src text)
returns jsonb
language plpgsql
stable
as $$
declare
  ln text;
  items jsonb := '[]'::jsonb;
  cur_text text := '';
  in_item boolean := false;
  m text[];
  id_prefix text := to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
begin
  if src is null or btrim(src) = '' then
    return '[]'::jsonb;
  end if;

  foreach ln in array regexp_split_to_array(replace(src, chr(13) || chr(10), chr(10)), chr(10))
  loop
    m := regexp_match(ln, '^\s*(\d{1,3})[.)]\s+(.*)$');
    if m is not null then
      -- Baris bernomor: flush poin sebelumnya, mulai poin baru.
      if in_item then
        items := items || jsonb_build_object(
          'id', id_prefix || '-' || (jsonb_array_length(items) + 1)::text,
          'title', '',
          'title_en', '',
          'text', btrim(cur_text),
          'text_en', '',
          'image_url', ''
        );
      end if;
      cur_text := m[2];
      in_item := true;
    elsif in_item and btrim(ln) <> '' then
      -- Baris lanjutan: gabung ke teks poin yang sedang berjalan.
      cur_text := cur_text || chr(10) || btrim(ln);
    end if;
    -- Baris kosong di tengah list: diabaikan (tidak memutus poin).
  end loop;

  -- Flush poin terakhir.
  if in_item then
    items := items || jsonb_build_object(
      'id', id_prefix || '-' || (jsonb_array_length(items) + 1)::text,
      'title', '',
      'title_en', '',
      'text', btrim(cur_text),
      'text_en', '',
      'image_url', ''
    );
  end if;

  return items;
end;
$$;

-- 3. Auto-migrasi: isi feature_items untuk project yang masih kosong
--    DAN full_description-nya mengandung list bernomor. Versi EN
--    digabungkan per indeks item (kalau ada).
with src as (
  select
    p.id,
    public.split_feature_items(p.full_description) as items_id,
    case
      when coalesce(p.full_description_en, '') <> ''
      then public.split_feature_items(p.full_description_en)
      else '[]'::jsonb
    end as items_en
  from public.projects p
  where
    p.feature_items = '[]'::jsonb
    and coalesce(p.full_description, '') <> ''
),
merged as (
  select
    s.id,
    case
      when s.items_en = '[]'::jsonb then s.items_id
      else (
        select jsonb_agg(
          jsonb_set(
            jsonb_set(
              fi.val,
              '{text_en}',
              to_jsonb(coalesce(e.val ->> 'text', '')),
              true
            ),
            '{title_en}',
            to_jsonb(coalesce(e.val ->> 'title', '')),
            true
          )
          order by fi.idx
        )
        from jsonb_array_elements(s.items_id) with ordinality as fi(val, idx)
        left join lateral (
          select x.val, x.idx
          from jsonb_array_elements(s.items_en) with ordinality as x(val, idx)
          where x.idx = fi.idx
        ) e on e.idx = fi.idx
      )
    end as items
  from src s
)
update public.projects p
set feature_items = m.items
from merged m
where p.id = m.id
  and m.items <> '[]'::jsonb;

-- 4. Realtime (ADD, bukan SET — tabel lain tetap di publication)
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null; end $$;

-- Selesai. Verifikasi:
--   select slug, jsonb_array_length(feature_items) as jumlah_poin
--   from projects where feature_items <> '[]'::jsonb;
