import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'
import SectionLabel from '../components/ui/SectionLabel'
import SectionBox from '../components/ui/SectionBox'
import JourneyTimeline from '../components/JourneyTimeline'
import { useJourneyEntries, useJourneyCategories } from '../hooks/useJourneyEntries'
import Seo from '../components/Seo'

/**
 * Halaman /perjalanan — timeline vertikal zigzag perjalanan:
 * garis tengah accent biru, filter kategori, urutan kronologis maju.
 * Dibuka dari menu "Perjalanan" di navbar.
 */
export default function JourneyPage() {
  const { lang } = useLanguage()
  const { entries, loading, isDummy } = useJourneyEntries()
  const { categories } = useJourneyCategories()

  return (
    <>
      <Seo
        title={`${t(ui.perjalananJudul, lang)} — ZAMIR`}
        description={t(ui.perjalananDesc, lang)}
        path="/perjalanan"
      />
      <Link
        to="/"
        data-edit-nav
        className="mx-auto mt-8 block max-w-5xl px-6 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
      >
        {t(ui.kembaliKeBeranda, lang)}
      </Link>
      <SectionBox id="perjalanan">
        <SectionLabel>{t(ui.perjalananJudul, lang)}</SectionLabel>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          {t(ui.perjalananDesc, lang)}
        </p>
        <JourneyTimeline
          entries={entries}
          categories={categories}
          loading={loading}
          isDummy={isDummy}
        />
      </SectionBox>
    </>
  )
}
