/**
 * Rate limiting form kontak (sisi KLIEN).
 *
 * Mencegah satu pengunjung mengirim pesan berkali-kali dalam waktu singkat:
 * setelah 1 pesan BERHASIL terkirim, tombol dikunci COOLDOWN_MS.
 *
 * Pendekatan: timestamp kiriman terakhir disimpan di localStorage
 * (per browser/sesi). Ini pilihan paling sederhana tanpa backend tambahan,
 * dan sesuai struktur project (INSERT langsung ke Supabase dari klien).
 *
 * CATATAN: karena berjalan di klien, pembatas ini bisa dilewati penyerang
 * yang memanggil PostgREST langsung. Untuk proteksi anti-spam yang
 * benar-benar kuat diperlukan validasi server-side (mis. Supabase Edge
 * Function + rate limit IP) — di luar cakupan perubahan ini.
 */
const KEY = 'portfolio_contact_last_sent'

/** Jeda minimum antar kiriman (1 menit). */
const COOLDOWN_MS = 60 * 1000

/** Sisa waktu tunggu (ms); 0 kalau boleh mengirim sekarang. */
export function getContactCooldownMs(now = Date.now()): number {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return 0
    const last = Number(raw)
    if (!Number.isFinite(last)) return 0
    return Math.max(0, last + COOLDOWN_MS - now)
  } catch {
    return 0
  }
}

/** Tandai bahwa pesan baru saja terkirim (mulai hitung cooldown). */
export function markContactSent(now = Date.now()): void {
  try {
    window.localStorage.setItem(KEY, String(now))
  } catch {
    /* storage diblokir — rate limit dilewati untuk sesi ini */
  }
}

/** Ubah ms jadi teks singkat, mis. "45 detik". */
export function formatCooldown(ms: number): string {
  return `${Math.ceil(ms / 1000)} detik`
}
