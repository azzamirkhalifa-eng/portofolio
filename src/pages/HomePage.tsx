import { useProfile } from '../hooks/useProfile'
import { useSkills } from '../hooks/useSkills'
import { useProjects } from '../hooks/useProjects'
import { useCategories } from '../hooks/useCategories'
import { useCustomSections } from '../hooks/useCustomSections'
import { useAchievements } from '../hooks/useAchievements'
import { useLanguage } from '../context/LanguageContext'
import { pick } from '../lib/i18n'
import { summarize, DEFAULT_DESCRIPTION } from '../lib/seo'
import Seo from '../components/Seo'
import SplashIntro from '../components/SplashIntro'
import Hero from '../components/Hero'
import About from '../components/About'
import Achievements from '../components/Achievements'
import Projects from '../components/Projects'
import Contact from '../components/Contact'
import CustomZone from '../components/CustomSections'

/**
 * Halaman utama — SATU alur scroll:
 * Hero → About → Projects (preview) → Contact, plus custom section
 * di zona after-about & after-contact. Section project lengkap +
 * filter ada di halaman /projects ("Lihat Semua Project").
 */
export default function HomePage() {
  const { profile, loading: profileLoading } = useProfile()
  const { skills, loading: skillsLoading } = useSkills()
  const { projects, loading: projectsLoading } = useProjects()
  const { categories } = useCategories()
  const { sections } = useCustomSections()
  const { achievements, loading: achievementsLoading } = useAchievements()
  const { lang } = useLanguage()

  // Meta Open Graph halaman utama: nama + tagline singkat dari profil.
  const name = profile?.name ?? 'ZAMIR'
  const tagline = pick(profile?.tagline, profile?.tagline_en, lang)
  const aboutText = pick(profile?.about_text, profile?.about_text_en, lang)

  return (
    <>
      <Seo
        title={tagline ? `${name} — ${summarize(tagline, 70)}` : `${name} — Portfolio`}
        description={aboutText || tagline || DEFAULT_DESCRIPTION}
        image={profile?.avatar_url || null}
        path="/"
      />

      {/* Intro/splash singkat — hanya di halaman utama, sekali per sesi. */}
      <SplashIntro name={name} />

      <Hero profile={profile} loading={profileLoading} />

      <About
        profile={profile}
        skills={skills}
        loading={profileLoading || skillsLoading}
      />
      <CustomZone
        zone="after-about"
        sections={sections.filter((s) => s.zone === 'after-about')}
      />

      {/* Sertifikat & Pencapaian — cuplikan beranda (featured) */}
      <Achievements
        achievements={achievements}
        loading={achievementsLoading}
        preview
      />

      <Projects
        profile={profile}
        projects={projects}
        categories={categories}
        loading={projectsLoading}
        preview
      />

      <Contact profile={profile} />
      <CustomZone
        zone="after-contact"
        sections={sections.filter((s) => s.zone === 'after-contact')}
      />
    </>
  )
}