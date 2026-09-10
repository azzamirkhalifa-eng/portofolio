import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import BackgroundLayer from './BackgroundLayer'
import TargetCursor from './fx/TargetCursor'
import { useProfile } from '../hooks/useProfile'
import { useEditMode } from '../context/EditModeContext'

/**
 * Layout semua halaman publik:
 * - EditModeProvider dipasang di App (level router), jadi status login,
 *   tombol Mode Edit & toast tetap ada saat pindah halaman dan juga
 *   tersedia di halaman admin.
 * - Navbar + Footer konsisten di semua halaman.
 * - Transisi halaman: fade + rise halus (~220ms) via framer-motion,
 *   keyed oleh pathname — back/forward browser tetap jalan normal.
 *
 * Latar belakang dekoratif (PixelSnow) dipasang sekali di sini supaya
 * menutupi penuh seluruh halaman (full-bleed sampai ke bawah), bukan
 * hanya di satu section. Diposisikan fixed di paling belakang (-z-20),
 * pointer-events-none, supaya tidak menghalangi scroll/klik/Mode Edit.
 */
export default function PublicLayout() {
  const location = useLocation()
  const outlet = useOutlet()
  const { profile } = useProfile()
  const { enabled: editMode } = useEditMode()

  /* Skala tipografi (diatur admin, persen; 100 = default) di-set ke
     <html> supaya berlaku ke SEMUA halaman (beranda, daftar project,
     detail) tanpa perlu wrapper per halaman. */
  useEffect(() => {
    const root = document.documentElement
    if (!profile) return
    const set = (k: string, v: number | undefined) =>
      root.style.setProperty(k, String(v ?? 100))
    set('--name-scale', profile.hero_name_scale)
    set('--tagline-scale', profile.tagline_scale)
    set('--section-title-scale', profile.section_title_scale)
    set('--body-scale', profile.body_scale)
    set('--card-title-scale', profile.card_title_scale)
    set('--card-text-scale', profile.card_text_scale)
  }, [profile])

  return (
    <>
      <ScrollToTop />

      {/* Lapisan dekoratif global: full layar, belakang semua konten. */}
      <BackgroundLayer />

      {/* Kursor kustom (React Bits — TargetCursor). Nonaktif di mobile
          (sudah ditangani komponen) dan saat Mode Edit supaya kursor normal
          dipakai untuk klik/isi teks inline. */}
      {!editMode && (
        <TargetCursor
          spinDuration={2}
          hideDefaultCursor
          parallaxOn
          cursorColorOnTarget="#d2d2d2"
        />
      )}

      {/* bg-transparent (bukan bg-background): body sudah hitam pekat, jadi
          lapisan PixelSnow fixed di -z-20 tetap terlihat menembus konten. */}
      <div className="relative min-h-screen bg-transparent text-foreground overflow-x-clip">
        <Navbar name={profile?.name} />

        <main>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer name={profile?.name} />
      </div>
    </>
  )
}