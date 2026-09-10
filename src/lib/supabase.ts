import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Salin .env.example ke .env lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

/** Client Supabase yang dipakai seluruh aplikasi (halaman publik + admin). */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Subscribe realtime ke perubahan satu tabel, lalu kembalikan fungsi
 * untuk berhenti subscribe (panggil di cleanup effect).
 *
 * Nama channel dibuat UNIK per panggilan karena kalau nama sama dengan
 * channel yang masih "subscribed" (mis. saat React StrictMode double-mount
 * di dev), supabase-js akan memakai ulang channel lama yang sudah
 * subscribe — menambah callback setelah subscribe() melempar error
 * "cannot add postgres_changes callbacks ... after subscribe()" dan
 * meruntuhkan seluruh aplikasi.
 */
export function subscribeToTable(
  table: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}