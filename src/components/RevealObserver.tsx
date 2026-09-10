import { useEffect } from 'react'

/**
 * Scroll-reveal (TAHAP 3): memantau semua elemen .reveal dan menandai
 * .is-visible saat pertama kali masuk viewport. Elemen muncul staggered
 * (delay antar elemen lewat inline animation-delay, ~100ms).
 * Elemen baru yang dirender belakangan (hasil fetch/edit admin) ikut
 * dipantau lewat MutationObserver.
 */
export default function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      // Muncul sedikit sebelum elemen benar-benar di tengah layar.
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const observeAll = () => {
      for (const el of document.querySelectorAll('.reveal')) {
        if (el.classList.contains('is-visible')) continue
        if (reduced) {
          // Pengguna yang memilih animasi berkurang: langsung tampil.
          el.classList.add('is-visible')
        } else {
          io.observe(el)
        }
      }
    }

    observeAll()
    const mo = new MutationObserver(observeAll)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}