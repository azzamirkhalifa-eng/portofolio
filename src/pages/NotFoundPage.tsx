import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Button from '../components/ui/Button'
import Seo from '../components/Seo'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'

/**
 * Halaman 404 — tampil untuk SEMUA URL yang tidak dikenali router
 * (route `path="*"` di dalam PublicLayout, jadi Navbar & Footer tetap ada).
 *
 * Desain mengikuti design system: latar gelap, aksen biru, font mono untuk
 * label. Elemen kreatifnya sengaja kecil — kartu bergaya terminal yang
 * melayang pelan, dengan kursor ketik berkedip, memakai gaya bahasa web ini.
 */
export default function NotFoundPage() {
  const { lang } = useLanguage()
  const { pathname, search } = useLocation()
  // Tampilkan path yang dicoba, dipotong supaya tetap rapi di kartu.
  const attempted = `${pathname}${search}`
  const shown = attempted.length > 42 ? `${attempted.slice(0, 42)}…` : attempted

  return (
    <>
      <Seo
        title={`404 — ${t(ui.notFoundTitle, lang)} | ZAMIR`}
        description={t(ui.notFoundDesc, lang)}
        path={pathname}
      />

      <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="font-mono text-sm uppercase tracking-[0.5em] text-accent-text"
        >
          404
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: 'easeOut' }}
          className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl"
        >
          {t(ui.notFoundTitle, lang)}
          <span className="text-accent-text">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
          className="mt-5 max-w-md text-sm leading-relaxed text-muted"
        >
          {t(ui.notFoundDesc, lang)}
        </motion.p>

        {/* Elemen kreatif: kartu terminal melayang + kursor berkedip. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: 0.2 },
            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="mt-12 w-full max-w-sm rounded-lg border border-hairline bg-surface/70 px-4 py-3 text-left backdrop-blur-sm"
        >
          <p className="font-mono text-xs text-muted">
            <span className="text-accent-text">$</span> buka &quot;{shown}&quot;
          </p>
          <p className="mt-1.5 font-mono text-xs text-faint/45">
            {t(ui.notFoundRoute, lang)}
            <span
              aria-hidden
              className="ml-1 inline-block w-[0.5em] animate-pulse bg-faint/50 align-middle"
              style={{ height: '0.9em' }}
            />
          </p>
        </motion.div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Button to="/">{t(ui.kembaliKeBeranda, lang).replace('← ', '')}</Button>
          <Button to="/projects" variant="ghost">
            {t(ui.lihatSemuaProject, lang)}
          </Button>
          <Button to="/perjalanan" variant="ghost">
            {t(ui.perjalananJudul, lang)}
          </Button>
        </div>
      </section>
    </>
  )
}
