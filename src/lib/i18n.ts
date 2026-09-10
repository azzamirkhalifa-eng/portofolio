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
  pencapaian: { id: 'Pencapaian', en: 'Achievements' },
  projects: { id: 'Projek', en: 'Projects' },
  contact: { id: 'Kontak', en: 'Contact' },

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
  sebelumnya: { id: '← Sebelumnya', en: '← Previous' },
  berikutnya: { id: 'Berikutnya →', en: 'Next →' },
  tanpaLink: { id: '(tanpa link)', en: '(no link)' },

  // Achievements
  lihatSemuaPencapaian: { id: 'Lihat Semua Pencapaian', en: 'View All Achievements' },

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
