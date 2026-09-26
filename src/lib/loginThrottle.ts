/**
 * Rate limiting percobaan login admin (sisi KLIEN).
 *
 * Lapisan pertahanan tambahan di browser: setelah MAX_ATTEMPTS kali gagal
 * dalam WINDOW_MS, form dikunci selama LOCK_MS. Melindungi dari brute-force
 * kasual dari satu browser.
 *
 * CATATAN PENTING: pembatas ini berjalan di klien, jadi bisa dilewati kalau
 * penyerang memanggil Supabase Auth langsung. Pertahanan utama tetap rate
 * limit SERVER-SIDE milik Supabase Auth (Dashboard -> Authentication ->
 * Rate Limits). Keduanya dipakai bersama.
 *
 * State disimpan di localStorage supaya tidak hilang saat refresh.
 */

const KEY = 'portfolio_login_attempts'

/** Jumlah kegagalan sebelum dikunci. */
const MAX_ATTEMPTS = 5
/** Jendela waktu penghitungan kegagalan (15 menit). */
const WINDOW_MS = 15 * 60 * 1000
/** Lama blokir setelah melewati batas (5 menit). */
const LOCK_MS = 5 * 60 * 1000

type State = { failures: number[]; lockUntil: number }

function read(): State {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { failures: [], lockUntil: 0 }
    const parsed = JSON.parse(raw) as Partial<State>
    return {
      failures: Array.isArray(parsed.failures)
        ? parsed.failures.filter((n): n is number => typeof n === 'number')
        : [],
      lockUntil:
        typeof parsed.lockUntil === 'number' ? parsed.lockUntil : 0,
    }
  } catch {
    return { failures: [], lockUntil: 0 }
  }
}

function write(state: State): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* localStorage diblokir — rate limit tetap jalan untuk sesi ini */
  }
}

/** Sisa waktu blokir dalam ms; 0 kalau tidak sedang diblokir. */
export function getLoginLockRemainingMs(now = Date.now()): number {
  return Math.max(0, read().lockUntil - now)
}

/**
 * Catat satu kegagalan login.
 * Mengembalikan sisa waktu blokir (ms): > 0 berarti sekarang terkunci.
 */
export function recordLoginFailure(now = Date.now()): number {
  const state = read()

  // Sudah terkunci — kembalikan sisa waktunya.
  if (state.lockUntil > now) return state.lockUntil - now

  // Buang kegagalan lama di luar jendela waktu.
  const failures = state.failures.filter((t) => now - t < WINDOW_MS)
  failures.push(now)

  if (failures.length >= MAX_ATTEMPTS) {
    const lockUntil = now + LOCK_MS
    write({ failures: [], lockUntil })
    return LOCK_MS
  }

  write({ failures, lockUntil: 0 })
  return 0
}

/** Reset hitungan setelah login berhasil. */
export function clearLoginFailures(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
}

/** Ubah ms jadi teks Indonesia, mis. "4 menit 30 detik". */
export function formatLockRemaining(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m <= 0) return `${s} detik`
  return s > 0 ? `${m} menit ${s} detik` : `${m} menit`
}
