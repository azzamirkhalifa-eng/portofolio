import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'
import { useAchievements } from '../hooks/useAchievements'
import Achievements from '../components/Achievements'

/**
 * Halaman /achievements — "Lihat Semua Pencapaian":
 * grid pencapaian LENGKAP + filter kategori. Dibuka dari tombol
 * "Lihat Semua Pencapaian" di beranda, atau dari link navbar.
 */
export default function AchievementsPage() {
  const { lang } = useLanguage()
  const { achievements, loading } = useAchievements()

  return (
    <>
      <Link
        to="/"
        data-edit-nav
        className="mx-auto mt-8 block max-w-5xl px-6 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
      >
        {t(ui.kembaliKeBeranda, lang)}
      </Link>
      <Achievements achievements={achievements} loading={loading} />
    </>
  )
}
