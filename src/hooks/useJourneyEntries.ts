import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { JourneyCategory, JourneyEntry } from '../types'

/** Tanggal dummy → ISO string (format sama dengan kolom date di DB). */
const D = (iso: string) => new Date(`${iso}T00:00:00Z`).toISOString()

/**
 * Data CONTOH (dummy) untuk preview tampilan SEBELUM migration-v18.sql
 * dijalankan di Supabase. Begitu tabel journey_entries ada isinya,
 * data asli otomatis menggantikan dummy ini.
 */
const DUMMY_ENTRIES: JourneyEntry[] = [
  {
    id: -1,
    title: 'Memulai Perjalanan di Dunia Kode',
    title_en: 'Starting My Journey in Code',
    entry_date: '2023-01-15',
    category_id: -1,
    excerpt:
      'Awal mula segalanya — baris kode pertama yang saya tulis dan alasan saya jatuh cinta pada programming.',
    excerpt_en:
      'Where it all began — my first lines of code and why I fell in love with programming.',
    full_story: '',
    full_story_en: '',
    hero_image: '',
    gallery_images: [],
    slug: 'memulai-perjalanan-di-dunia-kode',
    created_at: D('2023-01-15'),
    updated_at: D('2023-01-15'),
  },
  {
    id: -2,
    title: 'Menyelesaikan Project Pertama',
    title_en: 'Finishing My First Project',
    entry_date: '2024-06-20',
    category_id: -3,
    excerpt:
      'Project pertama yang benar-benar rilis — lengkap dengan drama deadline dan rasa lega.',
    excerpt_en:
      'The first project that actually shipped — complete with deadline drama and relief.',
    full_story: '',
    full_story_en: '',
    hero_image: '',
    gallery_images: [],
    slug: 'menyelesaikan-project-pertama',
    created_at: D('2024-06-20'),
    updated_at: D('2024-06-20'),
  },
  {
    id: -3,
    title: 'Bergabung dengan Tim Developer',
    title_en: 'Joining a Developer Team',
    entry_date: '2025-09-01',
    category_id: -2,
    excerpt:
      'Dari coding sendirian ke bekerja dalam tim — babak baru yang penuh pembelajaran.',
    excerpt_en:
      'From coding solo to working in a team — a new chapter full of lessons.',
    full_story: '',
    full_story_en: '',
    hero_image: '',
    gallery_images: [],
    slug: 'bergabung-dengan-tim-developer',
    created_at: D('2025-09-01'),
    updated_at: D('2025-09-01'),
  },
]

/** Kategori dummy — pasangan id kategori yang dirujuk dummy entries. */
const DUMMY_CATEGORIES: JourneyCategory[] = [
  { id: -1, name: 'Pendidikan', name_en: 'Education', position: 1 },
  { id: -2, name: 'Pengalaman', name_en: 'Experience', position: 2 },
  { id: -3, name: 'Project', name_en: 'Project', position: 3 },
]

/** Tabel journey sudah tersedia di DB (query tanpa error & tabel ada)? */
async function journeyTablesExist(): Promise<boolean> {
  const { error } = await supabase.from('journey_entries').select('id').limit(1)
  return !error
}

/**
 * Ambil daftar cerita perjalanan (timeline /perjalanan) + subscribe
 * realtime. Urutan tampil: kronologis MAJU — paling lama dulu (atas)
 * sampai paling baru (bawah), sesuai konsep membaca cerita.
 *
 * Kalau tabel belum dibuat (migration v18 belum dijalankan) atau masih
 * kosong, kembalikan data dummy supaya tampilan tetap bisa dicek —
 * flag `isDummy` = true dipakai UI untuk menampilkan catatan kecil.
 *
 * @param allowDummy false = JANGAN pakai dummy (dipakai dashboard admin:
 *        data harus asli, form jangan terisi kategori/id dummy).
 */
export function useJourneyEntries(allowDummy = true) {
  const [entries, setEntries] = useState<JourneyEntry[]>([])
  const [loading, setLoading] = useState(true)
  /** true = sedang menampilkan data contoh (tabel DB belum ada/berisi). */
  const [isDummy, setIsDummy] = useState(false)

  useEffect(() => {
    let active = true

    async function fetchEntries() {
      const { data, error } = await supabase
        .from('journey_entries')
        .select('*')
        .order('entry_date', { ascending: true })

      if (active) {
        if (error || (data ?? []).length === 0) {
          // Tabel belum ada / masih kosong → tampilkan dummy sebagai contoh.
          setEntries(allowDummy ? DUMMY_ENTRIES : [])
          setIsDummy(allowDummy)
        } else {
          setEntries(data ?? [])
          setIsDummy(false)
        }
        setLoading(false)
      }
    }

    void fetchEntries()

    const unsubscribe = subscribeToTable('journey_entries', () => {
      void fetchEntries()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [allowDummy])

  return { entries, loading, isDummy }
}

/**
 * Kategori cerita perjalanan + realtime. Fallback dummy seperti hook
 * entries di atas — `allowDummy: false` mengembalikan daftar kosong
 * kalau tabel belum ada (dipakai dashboard admin).
 */
export function useJourneyCategories({ allowDummy = true } = {}) {
  const [categories, setCategories] = useState<JourneyCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchCategories() {
      const { data, error } = await supabase
        .from('journey_categories')
        .select('*')
        .order('position', { ascending: true })

      if (active) {
        if (error || (data ?? []).length === 0) {
          setCategories(allowDummy ? DUMMY_CATEGORIES : [])
        } else {
          setCategories(data ?? [])
        }
        setLoading(false)
      }
    }

    void fetchCategories()

    const unsubscribe = subscribeToTable('journey_categories', () => {
      void fetchCategories()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [allowDummy])

  return { categories, loading, exists: journeyTablesExist }
}
