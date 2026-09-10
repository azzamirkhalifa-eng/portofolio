-- ============================================================
--  MIGRASI V16 — DUA BAHASA UNTUK SEMUA TEKS ADMIN
--  Melengkapi v15: tombol project, label CTA, spesifikasi,
--  tags, penyelenggara pencapaian, dan custom section.
--  Idempotent: aman dijalankan berulang. Data lama utuh.
-- ============================================================

-- 1. Projects: versi English
alter table public.projects
  add column if not exists cta_label_en text not null default '',
  add column if not exists buttons_en   jsonb not null default '[]',
  add column if not exists specs_en     jsonb not null default '{}',
  add column if not exists tags_en      text[] not null default '{}';

-- 2. Achievements: penyelenggara English
alter table public.achievements
  add column if not exists issuer_en text not null default '';

-- 3. Custom sections: judul, teks, label link English
alter table public.custom_sections
  add column if not exists title_en       text not null default '',
  add column if not exists text_en        text not null default '',
  add column if not exists link_label_en  text not null default '';

-- 4. Realtime (ADD, bukan SET — tabel lain tetap di publication)
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.achievements;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.custom_sections;
exception when duplicate_object then null; end $$;
