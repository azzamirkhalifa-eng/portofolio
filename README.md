# Portfolio Pribadi

Website portofolio pribadi — React + Vite + TypeScript + Tailwind CSS + Supabase.
Dark mode Vercel-style dengan accent biru. Semua konten diambil dari database
Supabase (bukan hardcode) dan dikelola lewat:

- **Dashboard admin** (`/admin`) — form CRUD lengkap.
- **Mode Edit** — setelah login admin, buka halaman publik lalu klik tombol
  *Mode Edit* di pojok kanan bawah: teks/foto bisa diedit langsung di tempat
  (auto-save + tombol Simpan), project & skill bisa ditambah/dihapus/diurutkan,
  plus blok section tambahan (teks / teks+gambar) di 3 zona halaman.
  Keamanan tulis tetap dipegang Row-Level Security Supabase — UI edit hanya
  tampil untuk admin, tapi RLS yang benar-benar menolak selain email admin.

## Tech Stack

- **React 19 + Vite 8 + TypeScript**
- **Tailwind CSS v4** — design tokens (warna, font, animasi) di `src/index.css`
- **Supabase** — Auth (login admin), Postgres (konten), Storage (gambar)
- **React Router** — routing halaman publik + admin

## Struktur Folder

```
supabase/
  schema.sql           # SQL lengkap untuk project BARU (sekali jalankan)
  migration-v2.sql     # migrasi tambahan: kategori, foto About, custom section
src/
  index.css                    # design tokens (warna, font, hairline, animasi)
  types/index.ts               # tipe Profile, Project, Skill, Category, CustomSection
  lib/supabase.ts              # Supabase client (dari .env)
  lib/auth.ts                  # login/logout helper
  lib/mutations.ts             # satu pintu semua operasi tulis DB
  lib/admin.ts                 # konstanta email admin (harus sama dengan RLS)
  context/EditModeContext.tsx  # status Mode Edit + toast + session admin
  hooks/                       # useProfile, useSkills, useProjects, useCategories, useCustomSections
  components/
    ui/                        # Button, SectionLabel, Badge
    edit/                      # InlineText, InlineImage, CategoryManager, dsb (Mode Edit)
    admin/                     # form CRUD dashboard + upload gambar
    Navbar, Hero, About, Projects, ProjectCard, Contact, Footer, CustomSections
  pages/
    HomePage.tsx               # halaman publik
    admin/                     # LoginPage + DashboardPage
```

## Setup Lokal

Prasyarat: Node.js 20+.

```bash
npm install
cp .env.example .env        # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev                 # buka http://localhost:5173
```

Build produksi:

```bash
npm run build
npm run preview
```

## Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → New query → tempel isi `supabase/schema.sql` → **Run**.
   (Ganti dulu email admin di bagian policies RLS dengan email kamu.)
3. **Project Settings → API** → salin `Project URL` dan `anon public key` ke `.env`.
4. Buat akun admin: **Authentication → Users → Add user** (email + password kamu,
   **persis sama** dengan email di policy RLS, centang *Auto Confirm User*).
5. Login di `/admin` untuk mengelola semua konten website.

> **Project lama yang sudah berjalan** cukup jalankan `supabase/migration-v2.sql`
> di SQL Editor (menambah tabel/kolom baru — tidak menghapus apa pun).

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di [vercel.com](https://vercel.com) → **Add New Project** → import repo → **Deploy**.
3. Tambahkan env vars di Vercel (Settings → Environment Variables) persis seperti `.env`:
   `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` → Redeploy.
4. Selesai. `vercel.json` sudah mengatur SPA rewrites untuk route `/admin/*`.
