/**
 * Kamus UI statis — teks antarmuka (label, tombol, judul section)
 * dalam Bahasa Indonesia (default) dan English.
 * Konten dari database (tagline, judul, deskripsi) TIDAK di sini —
 * itu disimpan di kolom `*_en` di Supabase (fallback otomatis ke ID).
 */
export type Lang = 'id' | 'en'

export type UiEntry = { id: string; en: string }

export const ui: Record<string, UiEntry> = {
  // Navbar
  beranda: { id: 'Beranda', en: 'Home' },
  about: { id: 'Tentang', en: 'About' },
  perjalanan: { id: 'Perjalanan', en: 'Journey' },
  pencapaian: { id: 'Pencapaian', en: 'Achievements' },
  projects: { id: 'Projek', en: 'Projects' },
  contact: { id: 'Kontak', en: 'Contact' },
  modeCerah: { id: 'Mode cerah', en: 'Light mode' },
  modeGelap: { id: 'Mode gelap', en: 'Dark mode' },

  // Hero
  hubungiSaya: { id: 'Hubungi Saya', en: 'Contact Me' },

  // Section titles
  tentangSaya: { id: 'Tentang Saya', en: 'About Me' },
  sertifikatPencapaian: { id: 'Sertifikat & Pencapaian', en: 'Certificates & Achievements' },
  kembaliKeBeranda: { id: '← Kembali ke Beranda', en: '← Back to Home' },
  kembaliKeProjects: { id: '← Kembali ke Projects', en: '← Back to Projects' },
  kembaliKePencapaian: { id: '← Kembali ke Pencapaian', en: '← Back to Achievements' },
  galeri: { id: 'Galeri', en: 'Gallery' },
  spesifikasi: { id: 'Spesifikasi', en: 'Specifications' },

  // Projects
  lihatSemuaProject: { id: 'Lihat Semua Project', en: 'View All Projects' },
  lihatDetail: { id: 'Lihat Detail', en: 'View Details' },
  semua: { id: 'Semua', en: 'All' },
  projectTidakDitemukan: { id: 'Project tidak ditemukan.', en: 'Project not found.' },
  pencapaianTidakDitemukan: { id: 'Pencapaian tidak ditemukan.', en: 'Achievement not found.' },
  projectTidakDitemukanDesc: {
    id: 'Project dengan alamat itu tidak ada — mungkin sudah dihapus atau link-nya salah.',
    en: "A project with that address doesn't exist — it may have been deleted or the link is wrong.",
  },
  pencapaianTidakDitemukanDesc: {
    id: 'Pencapaian dengan alamat itu tidak ada — mungkin sudah dihapus atau link-nya salah.',
    en: "An achievement with that address doesn't exist — it may have been deleted or the link is wrong.",
  },

  // Halaman 404 (route tidak dikenali)
  notFoundTitle: { id: 'Halaman ini tidak ditemukan', en: 'This page could not be found' },
  notFoundDesc: {
    id: 'Sepertinya tautan yang kamu buka salah, sudah dipindahkan, atau memang tidak pernah ada. Tenang — kamu tidak tersesat jauh.',
    en: "Looks like this link is wrong, has moved, or never existed. Don't worry — you're not far off track.",
  },
  notFoundRoute: { id: 'rute tidak ditemukan', en: 'route not found' },

  // Command palette (Ctrl/⌘+K)
  commandPaletteLabel: { id: 'Pencarian cepat', en: 'Quick search' },
  commandPalettePlaceholder: {
    id: 'Cari halaman, project, atau cerita…',
    en: 'Search pages, projects, or stories…',
  },
  commandPaletteEmpty: {
    id: 'Tidak ada hasil yang cocok.',
    en: 'No matching results.',
  },
  commandPaletteHint: { id: 'Enter buka · Esc tutup', en: 'Enter to open · Esc to close' },
  kategoriNavigasi: { id: 'NAVIGASI', en: 'NAVIGATION' },

  // Tombol "Acak" (random project / cerita)
  acak: { id: 'Acak', en: 'Random' },
  acakProject: { id: 'Project acak', en: 'Random project' },
  acakPerjalanan: { id: 'Cerita acak', en: 'Random story' },
  acakTooltip: {
    id: 'Buka satu pilihan secara acak',
    en: 'Open one pick at random',
  },
  lewati: { id: 'Lewati', en: 'Skip' },
  kategoriProject: { id: 'PROJECT', en: 'PROJECT' },
  kategoriPerjalanan: { id: 'PERJALANAN', en: 'JOURNEY' },
  sebelumnya: { id: '← Sebelumnya', en: '← Previous' },
  berikutnya: { id: 'Berikutnya →', en: 'Next →' },
  tanpaLink: { id: '(tanpa link)', en: '(no link)' },

  // Achievements
  lihatSemuaPencapaian: { id: 'Lihat Semua Pencapaian', en: 'View All Achievements' },

  // Perjalanan (timeline)
  perjalananJudul: { id: 'Perjalanan', en: 'Journey' },
  perjalananDesc: {
    id: 'Garis waktu perjalanan saya — dari awal mula sampai sekarang, dibaca dari atas ke bawah.',
    en: 'My journey timeline — from the beginning until now, read top to bottom.',
  },
  kembaliKePerjalanan: { id: '← Kembali ke Perjalanan', en: '← Back to Journey' },
  ceritaTidakDitemukan: { id: 'Cerita tidak ditemukan.', en: 'Story not found.' },
  ceritaTidakDitemukanDesc: {
    id: 'Cerita dengan alamat itu tidak ada — mungkin sudah dihapus atau link-nya salah.',
    en: "A story with that address doesn't exist — it may have been deleted or the link is wrong.",
  },
  kamuDiSini: { id: 'Kamu di sini sekarang', en: 'You are here now' },
  dataContoh: {
    id: 'Menampilkan data contoh — jalankan migration-v18.sql di Supabase untuk data asli.',
    en: 'Showing sample data — run migration-v18.sql in Supabase for real data.',
  },

  // Contact
  mariTerhubung: { id: 'Mari Terhubung', en: "Let's Connect" },
  contactDesc: {
    id: 'Tertarik bekerja sama, atau sekadar mau ngobrol soal project? Kirim email atau hubungi lewat sosial media di bawah.',
    en: "Interested in working together, or just want to chat about projects? Send an email or reach out via social media below.",
  },
  kirimPesan: { id: 'Kirim Pesan', en: 'Send a Message' },
  nama: { id: 'Nama', en: 'Name' },
  email: { id: 'Email', en: 'Email' },
  pesan: { id: 'Pesan', en: 'Message' },
  mengirim: { id: 'Mengirim…', en: 'Sending…' },
  pesanSukses: { id: 'Pesan berhasil dikirim, terima kasih!', en: 'Message sent successfully, thank you!' },
  namaKosong: { id: 'Nama tidak boleh kosong.', en: 'Name cannot be empty.' },
  emailInvalid: { id: 'Format email tidak valid.', en: 'Invalid email format.' },
  pesanKosong: { id: 'Pesan tidak boleh kosong.', en: 'Message cannot be empty.' },
  namaPanjang: { id: 'Nama maksimal 100 karakter.', en: 'Name must be at most 100 characters.' },
  emailPanjang: { id: 'Email maksimal 200 karakter.', en: 'Email must be at most 200 characters.' },
  pesanPanjang: { id: 'Pesan maksimal 2000 karakter.', en: 'Message must be at most 2000 characters.' },
  terlaluCepat: {
    id: 'Mohon tunggu sebentar sebelum mengirim pesan lagi.',
    en: 'Please wait a moment before sending another message.',
  },
  gagalMengirim: { id: 'Gagal mengirim. Coba lagi sebentar.', en: 'Failed to send. Please try again in a moment.' },
  namaPlaceholder: { id: 'Nama kamu', en: 'Your name' },
  pesanPlaceholder: { id: 'Halo, saya tertarik…', en: "Hi, I'm interested in…" },
}

/** Ambil teks UI sesuai bahasa aktif. */
export function t(entry: UiEntry, lang: Lang): string {
  return entry[lang]
}

/**
 * Pilih KONTEN database sesuai bahasa — fallback ke versi Bahasa
 * Indonesia kalau versi English kosong/belum diisi admin
 * (requirement Fitur 4 no. 4: teks tidak boleh jadi kosong).
 */
export function pick(
  idVal: string | null | undefined,
  enVal: string | null | undefined,
  lang: Lang,
): string {
  if (lang === 'en' && enVal != null && enVal.trim() !== '') return enVal
  return idVal ?? ''
}

/**
 * Label tanggal entri perjalanan: "Januari 2023" (input "2023-01")
 * atau "15 Januari 2023" (input "2023-01-15") — sesuai bahasa aktif.
 * Input tidak valid → dikembalikan apa adanya.
 */
export function formatEntryDate(value: string, lang: Lang): string {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m) return value
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  const opts: Intl.DateTimeFormatOptions =
    d != null
      ? { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }
      : { year: 'numeric', month: 'long', timeZone: 'UTC' }
  return new Date(Date.UTC(y, m - 1, d ?? 1)).toLocaleDateString(locale, opts)
}
