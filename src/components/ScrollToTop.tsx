import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Jeda tunggu section muncul setelah transisi halaman (AnimatePresence mode=\"wait\"). */
const HASH_RETRY_DELAYS = [120, 350]

/**
 * Manajer scroll:
 * - Ada hash (mis. /#about) → scroll ke section tersebut (halus kalau
 *   masih di halaman yang sama, langsung kalau baru pindah halaman).
 * - Tanpa hash → reset scroll ke atas setiap ganti pathname.
 * `html` punya `scroll-behavior: smooth` — dinonaktifkan sementara
 * supaya lompatan antar halaman tidak tampak seperti scroll halus.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    const crossPage = prevPathname.current !== pathname
    prevPathname.current = pathname
    html.style.scrollBehavior = 'auto'

    if (hash) {
      const id = hash.slice(1)
      const tryScroll = (attempt: number) => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: crossPage ? 'auto' : 'smooth' })
          html.style.scrollBehavior = prev
          return
        }
        const delay = HASH_RETRY_DELAYS[attempt]
        if (delay !== undefined) {
          window.setTimeout(() => tryScroll(attempt + 1), delay)
        } else {
          html.style.scrollBehavior = prev
        }
      }
      tryScroll(0)
      return
    }

    window.scrollTo(0, 0)
    html.style.scrollBehavior = prev
  }, [pathname, hash])

  return null
}