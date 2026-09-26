import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'

/**
 * Kunci sessionStorage: intro hanya muncul SEKALI per sesi kunjungan
 * (per tab browser). Refresh maupun kembali ke beranda dalam sesi yang
 * sama tidak memutar ulang animasinya.
 */
const SPLASH_KEY = 'portfolio_splash_shown'

/** Total waktu tampil sebelum auto-dismiss (ms) — target ≤ 1.5s total. */
const VISIBLE_MS = 1000

/**
 * Putuskan sekali per pemuatan halaman apakah intro perlu diputar.
 *
 * - Sudah tampil di sesi ini → tidak lagi.
 * - sessionStorage diblokir/penuh → lewati (jangan sampai berulang terus).
 * - Pengguna memilih animasi berkurang → lewati (murni dekoratif).
 *
 * Hasilnya di-cache di level modul supaya React StrictMode (dev) yang
 * me-render dua kali tidak menghabiskan jatah sekali-per-sesi.
 */
let splashResolved = false
let splashShouldPlay = false

function resolveSplash(): boolean {
  if (splashResolved) return splashShouldPlay
  splashResolved = true
  splashShouldPlay = (() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false
      }
      if (window.sessionStorage.getItem(SPLASH_KEY) === '1') return false
      window.sessionStorage.setItem(SPLASH_KEY, '1')
      return true
    } catch {
      /* sessionStorage diblokir — lewati agar tidak muncul tiap navigasi */
      return false
    }
  })()
  return splashShouldPlay
}

type SplashIntroProps = {
  /** Nama tampil (dipakai untuk inisial + label di bawahnya). */
  name?: string
}

/**
 * Intro/splash singkat (Fitur 5) — HANYA dipasang di halaman utama.
 *
 * Overlay hitam menutup layar, inisial nama muncul di tengah dengan
 * fade + scale halus, lalu auto-dismiss (±1 detik) atau langsung
 * dilewati dengan klik / menekan tombol apa pun. Setelah itu halaman
 * utama terlihat lewat fade-out halus dari overlay.
 */
export default function SplashIntro({ name = 'ZAMIR' }: SplashIntroProps) {
  const { lang } = useLanguage()
  const [visible, setVisible] = useState(resolveSplash)

  // Auto-dismiss singkat + kunci scroll selama overlay tampil, supaya
  // pengunjung tidak mendarat di posisi scroll yang berbeda.
  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(() => setVisible(false), VISIBLE_MS)

    const body = document.body
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(timer)
      body.style.overflow = prevOverflow
    }
  }, [visible])

  // Bisa di-skip: tekan tombol apa pun (tanpa modifier, agar Ctrl/⌘+K
  // tetap milik Command Palette) — klik ditangani di overlay.
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      setVisible(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  const initial = name.trim().charAt(0).toUpperCase() || 'Z'
  // Kalau logo gagal dimuat, tampilkan inisial sebagai fallback.
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          role="status"
          aria-label={`Intro ${name}`}
          onClick={() => setVisible(false)}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center gap-7 bg-background"
        >
          {/* Logo intro (public/LOGO.png) — glow aksen lembut di
              belakangnya; fallback ke inisial bila gambar gagal dimuat. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center"
          >
            <span
              aria-hidden
              className="absolute -inset-8 rounded-full bg-accent/10 blur-3xl"
            />
            {logoFailed ? (
              <div className="rounded-2xl bg-gradient-to-b from-faint/15 via-faint/5 to-transparent p-px">
                <div className="flex h-20 w-20 items-center justify-center rounded-[calc(1rem-1px)] border border-faint/5 bg-surface">
                  <span className="font-mono text-4xl tracking-tight text-foreground">
                    {initial}
                  </span>
                </div>
              </div>
            ) : (
              <img
                src="/LOGO.png"
                alt={name}
                fetchPriority="high"
                onError={() => setLogoFailed(true)}
                className="relative h-auto w-auto max-h-[34vh] max-w-[62vw] object-contain sm:max-h-[38vh]"
              />
            )}
          </motion.div>

          {/* Nama singkat di bawah inisial. */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4, ease: 'easeOut' }}
            className="font-mono text-xs uppercase tracking-[0.35em] text-muted"
          >
            {name}
            <span className="text-accent-text">.</span>
          </motion.p>

          {/* Petunjuk skip (klik di mana saja). */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="absolute bottom-8 font-mono text-[10px] uppercase tracking-[0.25em] text-faint/25"
          >
            {t(ui.lewati, lang)}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
