// Tes koneksi Supabase — jalankan dengan: node scripts/check-supabase.mjs
// Membaca .env, lalu fetch data dari tabel profile, projects, dan skills
// persis seperti yang dilakukan browser (client + anon key yang sama).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// Baca .env tanpa dependency tambahan
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
)

const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('✗ .env belum lengkap (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(url, key)

const checks = [
  { table: 'profile', select: 'id, name', label: 'profile' },
  { table: 'projects', select: 'id, title', label: 'projects' },
  { table: 'skills', select: 'id, label', label: 'skills' },
]

let failed = false

for (const c of checks) {
  const { data, error } = await supabase.from(c.table).select(c.select).limit(3)

  if (error) {
    failed = true
    console.log(`✗ ${c.label}: ERROR — ${error.message}`)
  } else {
    const preview = data.length
      ? JSON.stringify(data[0])
      : '(kosong)'
    console.log(`✓ ${c.label}: OK — ${data.length} baris, contoh: ${preview}`)
  }
}

if (failed) {
  console.log('\nAda error — cek pesan di atas.')
  process.exit(1)
}
console.log('\nKoneksi Supabase berhasil ✓ (anon key valid, RLS read terbuka).')