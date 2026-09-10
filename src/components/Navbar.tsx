import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useActiveSection } from '../hooks/useActiveSection'
import { useLanguage } from '../context/LanguageContext'
import { ui } from '../lib/i18n'

/** Label menu mengikuti bahasa aktif (diterjemahkan saat render). */
const menuLinks = [
  { key: 'beranda' as const, section: 'top' },
  { key: 'about' as const, section: 'about' },
  { key: 'pencapaian' as const, section: 'achievements' },
  { key: 'projects' as const, section: 'projects' },
  { key: 'contact' as const, section: 'contact' },
]

type NavbarProps = {
  /** Nama dari Supabase (tabel profile). */
  name?: string
}

/**
 * Navbar sticky di semua halaman publik.
 * - Desktop (≥sm): menu horizontal seperti sebelumnya.
 * - Mobile (<sm): tombol hamburger membuka panel menu vertikal;
 *   klik link = tutup panel + navigasi/scroll ke section.
 * Menu = scroll halus ke section di halaman utama (via hash),
 * section aktif ditandai underline aksen (scroll-spy).
 * `data-edit-nav` membuat link tetap bisa diklik saat Mode Edit aktif.
 */
export default function Navbar({ name }: NavbarProps) {
  const { pathname, hash } = useLocation()
  const { lang, setLang } = useLanguage()
  const activeSection = useActiveSection([
    'top',
    'about',
    'achievements',
    'projects',
    'contact',
  ])
  // true = halaman sudah di-scroll sedikit → navbar berubah jadi solid.
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Tutup panel mobile setiap pindah halaman/hash.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, hash])

  // Halaman utama → scroll-spy; area project/pencapaian → tandai menu-nya.
  const onProjectsArea = pathname.startsWith('/projects')
  const onAchievementsArea = pathname.startsWith('/achievements')
  const active =
    pathname === '/'
      ? activeSection
      : onProjectsArea
        ? 'projects'
        : onAchievementsArea
          ? 'achievements'
          : null

  /**
   * Klik menu saat hash TUJUAN sama dengan hash sekarang (mis. sudah di
   * /#about lalu klik "About" lagi): lokasi tidak berubah, jadi efek
   * scroll di ScrollToTop tidak jalan → scroll manual di sini supaya
   * klik ke-N tetap melompat ke section.
   */
  function handleMenuClick(e: ReactMouseEvent<HTMLAnchorElement>, section: string) {
    setMobileOpen(false)
    if (pathname === '/' && hash === `#${section}`) {
      e.preventDefault()
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  /** Logo: sudah di halaman utama → scroll manual ke paling atas. */
  function handleLogoClick(e: ReactMouseEvent<HTMLAnchorElement>) {
    setMobileOpen(false)
    if (pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const linkCls = (isActive: boolean) =>
    `relative text-sm transition-colors ${
      isActive ? 'text-foreground' : 'text-muted hover:text-foreground'
    }`

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled || mobileOpen
          ? 'border-b border-hairline bg-background/85 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.9)] backdrop-blur-md'
          : 'border-b border-transparent bg-transparent backdrop-blur-none'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          data-edit-nav
          onClick={handleLogoClick}
          className="cursor-target font-mono text-sm font-medium tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          {name || 'Portfolio'}
          <span className="text-accent">.</span>
        </Link>

        {/* Grup kanan (desktop): menu + toggle bahasa */}
        <div className="hidden items-center gap-5 sm:flex sm:gap-7">
        <ul className="hidden items-center gap-5 sm:flex sm:gap-7">
          {menuLinks.map((link) => {
            const isActive = active === link.section
            return (
              <li key={link.section}>
                <Link
                  to={`/#${link.section}`}
                  data-edit-nav
                  onClick={(e) => handleMenuClick(e, link.section)}
                  className={`cursor-target ${linkCls(isActive)}`}
                >
              {ui[link.key][lang]}
              {isActive && (
                    <span
                      aria-hidden
                      className="absolute -bottom-1.5 left-0 h-px w-full bg-accent"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Toggle bahasa ID/EN */}
        <button
          type="button"
          data-edit-nav
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
          title="Ganti bahasa / Switch language"
          className="cursor-target rounded-md border border-hairline px-2.5 py-1 font-mono text-xs transition-colors hover:border-white/30"
        >
          <span className={lang === 'id' ? 'font-bold text-accent' : 'text-white/30'}>ID</span>
          <span className="mx-1 text-white/20">/</span>
          <span className={lang === 'en' ? 'font-bold text-accent' : 'text-white/30'}>EN</span>
        </button>
        </div>

        {/* Tombol hamburger (<sm) */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-hairline text-foreground transition-colors hover:border-white/25 sm:hidden"
        >
          <svg
            aria-hidden
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>        {/* Panel menu mobile (<sm) */}
        {mobileOpen && (
          <ul className="border-t border-hairline px-4 pb-4 pt-2 sm:hidden">
            {menuLinks.map((link) => {
            const isActive = active === link.section
            return (
              <li key={link.section}>
                <Link
                  to={`/#${link.section}`}
                  data-edit-nav
                  onClick={(e) => handleMenuClick(e, link.section)}
                  className={`block rounded-md px-2 py-3 text-base ${linkCls(isActive)}`}
                >
                  {ui[link.key][lang]}
                </Link>
              </li>
            )
          })}

          {/* Toggle bahasa — versi mobile */}
          <li className="pt-2">
            <button
              type="button"
              data-edit-nav
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-hairline px-2 py-2.5 font-mono text-sm"
            >
              <span className={lang === 'id' ? 'font-bold text-accent' : 'text-white/30'}>ID</span>
              <span className="text-white/20">/</span>
              <span className={lang === 'en' ? 'font-bold text-accent' : 'text-white/30'}>EN</span>
            </button>
          </li>
        </ul>
      )}
    </header>
  )
}
