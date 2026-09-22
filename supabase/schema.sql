-- ============================================================
--  PORTFOLIO DATABASE — jalankan di Supabase SQL Editor
--  (Supabase Dashboard -> SQL Editor -> New query -> Run)
--  Email admin: azzamirkhalifa@gmail.com
--  = versi lengkap untuk project BARU =
--  (project lama yang sudah jalan cukup menjalankan migration-v2.sql)
-- ============================================================

-- ============================================================
-- 1. TABEL: categories — daftar kategori project
-- ============================================================
create table if not exists public.categories (
  id        bigint generated always as identity primary key,
  name      text not null unique,
  name_en   text not null default '',
  position  int  not null default 0
);

-- ============================================================
-- 2. TABEL: profile (1 baris, id wajib 1) — konten hero, about & contact
-- ============================================================
create table if not exists public.profile (
  id                int primary key default 1 check (id = 1),
  name              text not null default '',
  tagline           text not null default '',
  tagline_en        text not null default '',
  hero_cta_text     text not null default 'Lihat Project',
  hero_cta_text_en  text not null default '',
  about_title       text not null default 'Tentang Saya',
  about_title_en    text not null default '',
  about_text        text not null default '',
  about_text_en     text not null default '',
  avatar_url        text not null default '',
  about_avatar_url  text not null default '',
  about_photo_side  text not null default 'left' check (about_photo_side in ('left', 'right')),
  projects_columns  int  not null default 2 check (projects_columns between 1 and 3),
  email             text not null default '',
  github_url        text not null default '',
  instagram_url     text not null default '',
  linkedin_url      text not null default '',
  twitter_url       text not null default '',
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- 3. TABEL: skills — badge/tag di section About
-- ============================================================
create table if not exists public.skills (
  id          bigint generated always as identity primary key,
  label       text not null,
  position    int  not null default 0,
  proficiency int  not null default 0 check (proficiency between 0 and 100)
);

-- ============================================================
-- 4. TABEL: projects — daftar project
-- ============================================================
create table if not exists public.projects (
  id               bigint generated always as identity primary key,
  title            text not null,
  description      text not null default '',
  image_url        text not null default '',
  tags             text[] not null default '{}',
  demo_url         text not null default '',
  github_url       text not null default '',
  category_id      bigint references public.categories (id) on delete set null,
  position         int  not null default 0,
  slug             text unique,
  full_description text not null default '',
  gallery          text[] not null default '{}',
  specs            jsonb not null default '{}',
  content_blocks   jsonb not null default '[]',
  buttons          jsonb not null default '[]',
  cta_label        text not null default '',
  cta_url          text not null default '',
  featured         boolean not null default true,
  view_count       int not null default 0,
  title_en             text not null default '',
  description_en       text not null default '',
  full_description_en  text not null default '',
  cta_label_en         text not null default '',
  buttons_en           jsonb not null default '[]',
  specs_en             jsonb not null default '{}',
  tags_en              text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- RPC penghitung view: anon boleh memanggil, tanpa hak UPDATE langsung
create or replace function public.increment_project_view(p_project_id bigint)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update public.projects
  set view_count = coalesce(view_count, 0) + 1
  where id = p_project_id
  returning view_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

grant execute on function public.increment_project_view(bigint) to anon, authenticated;

-- ============================================================
-- 5. TABEL: achievement_categories — kategori sertifikat/pencapaian
--    (dibuat sebelum achievements karena jadi referensi FK)
-- ============================================================
create table if not exists public.achievement_categories (
  id       bigint generated always as identity primary key,
  name     text not null unique,
  name_en  text not null default '',
  position int  not null default 0
);

-- ============================================================
-- 5b. TABEL: achievements — sertifikat & pencapaian
-- ============================================================
create table if not exists public.achievements (
  id          bigint generated always as identity primary key,
  title       text not null,
  issuer      text not null default '',
  year        text not null default '',
  image_url   text not null default '',
  description text not null default '',
  title_en            text not null default '',
  description_en      text not null default '',
  full_description_en text not null default '',
  issuer_en           text not null default '',
  full_description    text not null default '',
  featured            boolean not null default true,
  slug                text unique,
  gallery             text[] not null default '{}',
  category_id bigint references public.achievement_categories (id) on delete set null,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- 6. TABEL: messages — pesan dari form kontak
-- ============================================================
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7. TABEL: custom_sections — blok konten tambahan
-- ============================================================
create table if not exists public.custom_sections (
  id          bigint generated always as identity primary key,
  zone        text not null default 'after-projects'
              check (zone in ('after-about', 'after-projects', 'after-contact')),
  position    int  not null default 0,
  visible     boolean not null default true,
  layout      text not null default 'text'
              check (layout in ('text', 'text-image')),
  title       text not null default '',
  text        text not null default '',
  image_url   text not null default '',
  link_label  text not null default '',
  link_url    text not null default '',
  title_en       text not null default '',
  text_en        text not null default '',
  link_label_en  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- 8. TRIGGER: otomatis update updated_at saat data diubah
-- ============================================================
-- Defensif: hanya set updated_at kalau kolomnya memang ada di tabel tsb
-- (mencegah error 'record "new" has no field "updated_at"')
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = tg_table_schema
      and table_name  = tg_table_name
      and column_name = 'updated_at'
  ) then
    new.updated_at = now();
  end if;
  return new;
end $$;

drop trigger if exists trg_profile_updated_at on public.profile;
create trigger trg_profile_updated_at before update on public.profile
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_custom_sections_updated_at on public.custom_sections;
create trigger trg_custom_sections_updated_at before update on public.custom_sections
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_achievements_updated_at on public.achievements;
create trigger trg_achievements_updated_at before update on public.achievements
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
--    Siapa pun boleh MEMBACA (website publik); hanya admin yang boleh menulis
--    Khusus messages: siapa pun boleh INSERT (form kontak publik),
--    tapi hanya admin yang boleh baca/update/delete.
-- ============================================================
alter table public.profile          enable row level security;
alter table public.skills           enable row level security;
alter table public.projects         enable row level security;
alter table public.categories       enable row level security;
alter table public.custom_sections  enable row level security;
alter table public.achievements     enable row level security;
alter table public.achievement_categories enable row level security;
alter table public.messages         enable row level security;

create policy "public read profile"         on public.profile         for select using (true);
create policy "public read skills"          on public.skills          for select using (true);
create policy "public read projects"        on public.projects        for select using (true);
create policy "public read categories"      on public.categories      for select using (true);
create policy "public read custom_sections" on public.custom_sections for select using (true);
drop policy if exists "public read achievements" on public.achievements;
create policy "public read achievements"    on public.achievements    for select using (true);
drop policy if exists "public read achievement_categories" on public.achievement_categories;
create policy "public read achievement_categories" on public.achievement_categories for select using (true);

-- messages: form kontak publik (anon boleh kirim), baca/hapus admin saja
create policy "public insert messages"
  on public.messages for insert to anon, authenticated with check (true);
create policy "admin read messages" on public.messages
  for select using (auth.email() = 'azzamirkhalifa@gmail.com');
create policy "admin update messages" on public.messages
  for update using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');
create policy "admin delete messages" on public.messages
  for delete using (auth.email() = 'azzamirkhalifa@gmail.com');

-- Email admin: azzamirkhalifa@gmail.com
create policy "admin write profile" on public.profile
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

create policy "admin write skills" on public.skills
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

create policy "admin write projects" on public.projects
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

create policy "admin write categories" on public.categories
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

create policy "admin write custom_sections" on public.custom_sections
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

drop policy if exists "admin write achievements" on public.achievements;
create policy "admin write achievements" on public.achievements
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

drop policy if exists "admin write achievement_categories" on public.achievement_categories;
create policy "admin write achievement_categories" on public.achievement_categories
  for all using (auth.email() = 'azzamirkhalifa@gmail.com')
  with check (auth.email() = 'azzamirkhalifa@gmail.com');

-- ============================================================
-- 10. STORAGE: bucket "portfolio-images" untuk avatar & gambar project
-- ============================================================
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

create policy "public read portfolio images" on storage.objects
  for select using (bucket_id = 'portfolio-images');

create policy "admin upload portfolio images" on storage.objects
  for insert with check (bucket_id = 'portfolio-images' and auth.email() = 'azzamirkhalifa@gmail.com');

create policy "admin update portfolio images" on storage.objects
  for update using (bucket_id = 'portfolio-images' and auth.email() = 'azzamirkhalifa@gmail.com');

create policy "admin delete portfolio images" on storage.objects
  for delete using (bucket_id = 'portfolio-images' and auth.email() = 'azzamirkhalifa@gmail.com');

-- ============================================================
-- 11. REALTIME: halaman publik auto-update saat admin menyimpan
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.profile;
  alter publication supabase_realtime add table public.skills;
  alter publication supabase_realtime add table public.projects;
  alter publication supabase_realtime add table public.categories;
  alter publication supabase_realtime add table public.custom_sections;
  alter publication supabase_realtime add table public.achievements;
  alter publication supabase_realtime add table public.achievement_categories;
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- Index pendukung
create index if not exists achievements_position_idx
  on public.achievements (position asc);
create index if not exists achievement_categories_position_idx
  on public.achievement_categories (position asc);
create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

-- ============================================================
-- 12. SEED: data awal (nanti diedit lewat Mode Edit / dashboard)
-- ============================================================
insert into public.profile (id, name, tagline, hero_cta_text, about_title, about_text, email)
values (
  1,
  'Nama Kamu',
  'Tagline singkat — misal: "Desain. Kode. Buat hal keren."',
  'Lihat Project',
  'Tentang Saya',
  'Deskripsi singkat tentang kamu, skill, dan apa yang kamu suka kerjakan.',
  'azzamirkhalifa@gmail.com'
)
on conflict (id) do nothing;

insert into public.skills (label, position) values
  ('React', 1), ('TypeScript', 2), ('Tailwind CSS', 3), ('Figma', 4), ('Supabase', 5);

insert into public.categories (name, position) values
  ('Web App',    1),
  ('Web Design', 2),
  ('UI/UX',      3),
  ('Mobile App', 4),
  ('Design',     5)
on conflict (name) do nothing;

insert into public.projects
  (title, description, image_url, tags, demo_url, github_url, category_id, position)
values
  ('Project Pertama', 'Deskripsi singkat project pertamamu.', '',
   array['React','Vite'], 'https://example.com', 'https://github.com/username',
   (select id from public.categories where name = 'Web App'), 1),
  ('Project Kedua', 'Deskripsi singkat project keduamu.', '',
   array['TypeScript','Supabase'], 'https://example.com', 'https://github.com/username',
   (select id from public.categories where name = 'UI/UX'), 2);
