import { useEffect, useState } from 'react'

/**
 * Scroll-spy: kembalikan id section yang sedang berada di area atas
 * viewport (garis ~40% tinggi layar). Dipakai Navbar untuk menandai
 * section aktif saat halaman utama di-scroll.
 */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    let raf = 0

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.4
        let current: string | null = null
        for (const id of ids) {
          const el = document.getElementById(id)
          if (!el) continue
          const rect = el.getBoundingClientRect()
          // Section yang membentang di garis penanda = yang sedang aktif
          // (yang terakhir menang supaya bagian bawah halaman ikut aktif).
          if (rect.top <= line && rect.bottom > line) {
            current = id
          }
        }
        setActive(current)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids.join(',')])

  return active
}