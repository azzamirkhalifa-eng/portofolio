import { useEffect } from 'react'
import { SITE_NAME, absoluteUrl, summarize } from '../lib/seo'

/**
 * Kelola satu tag <meta> di <head>: perbarui bila sudah ada, buat bila
 * belum, dan hapus bila kontennya kosong. Pencarian memakai attribute-nya
 * (name/property) sehingga TIDAK pernah ada tag ganda — penting karena
 * React 19 (native metadata) tidak melakukan dedupe.
 */
function setMeta(
  attr: 'name' | 'property',
  key: string,
  content: string,
): void {
  const existing = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  )
  if (content === '') {
    existing?.remove()
    return
  }
  if (existing) {
    existing.setAttribute('content', content)
    return
  }
  const el = document.createElement('meta')
  el.setAttribute(attr, key)
  el.setAttribute('content', content)
  document.head.appendChild(el)
}

/** Kelola <link rel="canonical"> — satu tag, diperbarui di tempat. */
function setCanonical(href: string): void {
  const existing = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (!href) {
    existing?.remove()
    return
  }
  if (existing) {
    existing.setAttribute('href', href)
    return
  }
  const el = document.createElement('link')
  el.setAttribute('rel', 'canonical')
  el.setAttribute('href', href)
  document.head.appendChild(el)
}

type SeoProps = {
  /** Judul halaman (juga jadi og:title & twitter:title). */
  title: string
  /** Deskripsi singkat — dirapatkan & dipotong 160 karakter. */
  description?: string
  /** Gambar preview: foto profil / gambar utama project / hero cerita. */
  image?: string | null
  /** Path route saat ini (mis. `/projects/foo`) untuk og:url & canonical. */
  path?: string
  /** og:type — 'website' untuk halaman umum, 'article' untuk detail. */
  type?: 'website' | 'article'
}

/**
 * Kelola metadata dokumen per halaman (Fitur: Open Graph / preview share).
 *
 * Dipakai deklaratif di setiap halaman publik; nilainya mengikuti data
 * dinamis (project/cerita) begitu hook selesai memuat. Karena SPA murni,
 * tag ini di-set di sisi klien — lihat catatan di README/percakapan soal
 * crawler yang tidak menjalankan JavaScript.
 */
export default function Seo({
  title,
  description = '',
  image = null,
  path = '/',
  type = 'website',
}: SeoProps) {
  useEffect(() => {
    const desc = summarize(description)
    const url = absoluteUrl(path)
    const img = image ? absoluteUrl(image) : ''

    document.title = title

    // SEO dasar
    setMeta('name', 'description', desc)

    // Open Graph
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:image', img)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)

    // Twitter Card
    setMeta('name', 'twitter:card', img ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', img)

    setCanonical(url)
  }, [title, description, image, path, type])

  return null
}
