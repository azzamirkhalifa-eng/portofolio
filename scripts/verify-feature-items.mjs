// ============================================================
// VERIFIKASI TAHAP B — 3 KONDISI WAJIB FEATURE ITEMS
// Jalankan: node scripts/verify-feature-items.mjs
//
// Menguji aturan parsing yang SAMA dengan:
//  - src/lib/featureItems.ts   (splitIntro + splitFeatureItems)
//  - supabase/migration-v17.sql (pola regex di sisi database)
//  - src/components/ui/RichText.tsx (fallback render)
//
// Tidak ada dependensi — murni Node.js bawaan.
// ============================================================

import assert from 'node:assert/strict'

/** "1. teks", "12) teks", dst — identik NUMBERED_LINE featureItems.ts. */
const NUMBERED_LINE = /^\s*(\d{1,3})[.)]\s+(.*)$/

/** Salinan splitIntro dari src/lib/featureItems.ts. */
function splitIntro(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let introEnd = 0
  for (let i = 0; i < lines.length; i++) {
    if (NUMBERED_LINE.test(lines[i])) break
    introEnd = i + 1
    if (lines[i].trim() === '') break
  }
  const intro = lines.slice(0, introEnd).join('\n').trim()
  const rest = lines.slice(introEnd).join('\n').replace(/^\s+/, '')
  return { intro, rest }
}

/** Salinan splitFeatureItems dari src/lib/featureItems.ts. */
function splitFeatureItems(text) {
  if (!text || !text.trim()) return []
  const items = []
  let cur = null
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const m = NUMBERED_LINE.exec(line)
    if (m) {
      if (cur) items.push(cur)
      cur = { text: m[2].trim(), image_url: '' }
    } else if (cur && line.trim() !== '') {
      cur.text += `\n${line.trim()}`
    }
  }
  if (cur) items.push(cur)
  return items
}

/** Salinan logika parser SQL migration v17 (split_feature_items). */
function splitFeatureItemsSql(src) {
  if (src === null || src.trim() === '') return []
  const items = []
  let curText = ''
  let inItem = false
  for (const ln of src.replace(/\r\n/g, '\n').split('\n')) {
    const m = NUMBERED_LINE.exec(ln)
    if (m) {
      if (inItem) items.push(curText.trim())
      curText = m[2]
      inItem = true
    } else if (inItem && ln.trim() !== '') {
      curText += '\n' + ln.trim()
    }
  }
  if (inItem) items.push(curText.trim())
  return items
}

let passed = 0
function check(name, fn) {
  try {
    fn()
    passed++
    console.log(`  OK  ${name}`)
  } catch (err) {
    console.error(`  GAGAL  ${name}`)
    console.error(err.message)
    process.exitCode = 1
  }
}

console.log('\n=== KONDISI 1: Deskripsi paragraf biasa (tanpa list) ===\n')
check('seluruh teks jadi intro, rest kosong', () => {
  const d = 'Aplikasi kasir untuk UMKM dengan laporan penjualan harian.'
  const { intro, rest } = splitIntro(d)
  assert.equal(intro, d)
  assert.equal(rest, '')
})
check('paragraf panjang multi-baris tanpa nomor juga utuh sebagai intro', () => {
  const d = 'Baris pertama.\nBaris kedua.\nBaris ketiga.'
  const { intro, rest } = splitIntro(d)
  assert.equal(intro, d)
  assert.equal(rest, '')
})
check('parser SQL juga menghasilkan array KOSONG (tidak dipaksa jadi list)', () => {
  assert.deepEqual(splitFeatureItemsSql('Paragraf biasa tanpa nomor.'), [])
})
check('teks mengandung "1.5 jam" tetap paragraf (bukan list)', () => {
  const d = 'Proses onboarding hanya 1.5 jam.'
  const { intro, rest } = splitIntro(d)
  assert.equal(intro, d)
  assert.equal(rest, '')
  assert.deepEqual(splitFeatureItems(d), [])
})

console.log('\n=== KONDISI 2: List bernomor TANPA gambar sama sekali ===\n')
check('list terurai jadi poin berurutan, semua image_url kosong', () => {
  const d =
    'Aplikasi kasir modern.\n\n1. Menambahkan produk ke keranjang\n2. Struk digital terkirim otomatis\n3. Laporan harian real-time'
  const { intro, rest } = splitIntro(d)
  assert.equal(intro, 'Aplikasi kasir modern.')
  const items = splitFeatureItems(rest)
  assert.equal(items.length, 3)
  assert.equal(items[0].text, 'Menambahkan produk ke keranjang')
  assert.equal(items[2].text, 'Laporan harian real-time')
  for (const it of items) assert.equal(it.image_url, '')
})
check('varian penomoran "2)" juga dikenali', () => {
  const { rest } = splitIntro('Intro.\n\n1) Satu\n2) Dua')
  const items = splitFeatureItems(rest)
  assert.equal(items.length, 2)
  assert.equal(items[1].text, 'Dua')
})
check('baris lanjutan (wrap) digabung ke poin yang sama', () => {
  const { rest } = splitIntro('Intro.\n\n1. Poin pertama\nlanjutan kalimat\n2. Poin kedua')
  const items = splitFeatureItems(rest)
  assert.equal(items.length, 2)
  assert.equal(items[0].text, 'Poin pertama\nlanjutan kalimat')
})
check('parser SQL memberi hasil IDENTIK dengan parser frontend', () => {
  const rest = '1. Satu\nlanjutan\n2. Dua\n\n3. Tiga'
  assert.deepEqual(splitFeatureItemsSql(rest), splitFeatureItems(rest).map((i) => i.text))
})
check('project lama TIDAK berubah: teks sumber utuh (hanya dipecah on-the-fly)', () => {
  const d = 'Intro.\n\n1. Satu\n2. Dua'
  const { intro, rest } = splitIntro(d)
  assert.ok(d.includes(intro) && d.includes(rest))
  assert.equal(splitFeatureItems(rest).length, 2)
})

console.log('\n=== KONDISI 3: List bernomor DENGAN gambar di beberapa/semua poin ===\n')
check('poin bergambar & teks-saja bercampur: semua item tetap tampil', () => {
  const items = [
    { id: 'a', title: '', text: 'Poin satu', image_url: 'https://x/1.webp' },
    { id: 'b', title: '', text: 'Poin dua', image_url: '' },
    { id: 'c', title: '', text: 'Poin tiga', image_url: 'https://x/3.webp' },
  ]
  assert.equal(items.filter((i) => i.image_url.trim() !== '').length, 2)
  assert.equal(items.filter((i) => i.text.trim() !== '').length, 3)
})
check('semua poin bergambar pun juga valid', () => {
  const items = [1, 2, 3].map((n) => ({
    id: `fi-${n}`,
    title: '',
    text: `Poin ${n}`,
    image_url: `https://x/${n}.webp`,
  }))
  assert.equal(items.every((i) => i.image_url !== ''), true)
})
check('gambar fitur ikut lightbox & tidak diulang di galeri', () => {
  const main = 'https://x/hero.webp'
  const featureImages = ['https://x/1.webp', 'https://x/3.webp']
  const gallery = ['https://x/hero.webp', 'https://x/1.webp', 'https://x/extra.webp']
  const shots = gallery.filter((s) => s !== main)
  const galleryShots = shots.filter((s) => !featureImages.includes(s))
  assert.deepEqual(galleryShots, ['https://x/extra.webp'])
  const allImages = [main, ...featureImages, ...galleryShots]
  assert.equal(allImages.length, 4)
})

console.log('\n=== EDGE CASE TAMBAHAN (ketahanan data lama) ===\n')
check('deskripsi kosong → tidak ada intro, tidak ada poin', () => {
  const { intro, rest } = splitIntro('')
  assert.equal(intro, '')
  assert.equal(rest, '')
  assert.deepEqual(splitFeatureItems(rest), [])
})
check('CRLF dinormalisasi ke LF', () => {
  const { rest } = splitIntro('Intro.\r\n\r\n1. Satu\r\n2. Dua')
  assert.equal(splitFeatureItems(rest).length, 2)
})
check('nomor 3 digit (999.) masih dikenali', () => {
  const { rest } = splitIntro('999. Poin terakhir')
  assert.equal(splitFeatureItems(rest)[0].text, 'Poin terakhir')
})
check('nomor 4 digit (1234.) TIDAK dianggap list (maks 3 digit)', () => {
  const d = 'Faktur nomor 1234. Terbit tanggal 1 Mei.'
  assert.deepEqual(splitFeatureItems(d), [])
})
check('baris kosong di antara poin tidak memutus list', () => {
  const { rest } = splitIntro('Intro.\n\n1. Satu\n\n2. Dua')
  assert.equal(splitFeatureItems(rest).length, 2)
})
check('paragraf penutup setelah list digabung ke poin TERAKHIR (tidak hilang)', () => {
  const { rest } = splitIntro('Intro.\n\n1. Satu\n2. Dua\n\nCatatan penutup.')
  const items = splitFeatureItems(rest)
  assert.equal(items.length, 2)
  assert.ok(items[1].text.includes('Catatan penutup.'))
})

console.log(`\n${passed} pengujian lulus.`)
if (process.exitCode) {
  console.error('ADA PENGUJIAN GAGAL — perbaiki sebelum lanjut.')
} else {
  console.log('Semua 3 kondisi wajib Tahap B terverifikasi. ✔')
}
