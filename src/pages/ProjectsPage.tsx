import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'
import { useProfile } from '../hooks/useProfile'
import { useProjects } from '../hooks/useProjects'
import { useCategories } from '../hooks/useCategories'
import { useCustomSections } from '../hooks/useCustomSections'
import Projects from '../components/Projects'
import CustomZone from '../components/CustomSections'

/**
 * Halaman /projects — "Lihat Semua Project":
 * grid project LENGKAP + filter kategori + zona after-projects.
 * Dibuka dari tombol "Lihat Semua Project" di beranda.
 */
export default function ProjectsPage() {
  const { lang } = useLanguage()
  const { profile } = useProfile()
  const { projects, loading } = useProjects()
  const { categories } = useCategories()
  const { sections } = useCustomSections()

  return (
    <>
      <Link
        to="/"
        data-edit-nav
        className="mx-auto mt-8 block max-w-5xl px-6 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
      >
        {t(ui.kembaliKeBeranda, lang)}
      </Link>
      <Projects
        profile={profile}
        projects={projects}
        categories={categories}
        loading={loading}
      />
      <CustomZone
        zone="after-projects"
        sections={sections.filter((s) => s.zone === 'after-projects')}
      />
    </>
  )
}