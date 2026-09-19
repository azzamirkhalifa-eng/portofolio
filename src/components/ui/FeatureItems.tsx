import { useMemo } from 'react'
import type { FeatureItem } from '../../types'
import { featureItemText, featureItemTitle } from '../../lib/featureItems'
import { useEditMode } from '../../context/EditModeContext'
import { useLanguage } from '../../context/LanguageContext'
import SmoothImage from './SmoothImage'
import ZoomCue from './ZoomCue'
import { NumberBadge } from './RichText'

/**
 * Pola posisi gambar poin fitur (Bagian 2):
 * - 'zigzag' : gambar kiri/kanan bergantian antar item bergambar (default).
 * - 'left'   : gambar selalu di kiri.
 * - 'right'  : gambar selalu di kanan.
 * Default diatur konstanta di bawah — ganti sekali, berlaku semua project.
 */
export type FeatureImageSideMode = 'zigzag' | 'left' | 'right'
export const FEATURE_IMAGE_SIDE: FeatureImageSideMode = 'zigzag'

type FeatureItemsProps = {
  items: FeatureItem[]
  /** Buka lightbox ke indeks slide absolut (hero + fitur + galeri). */
  onOpenImage: (src: string) => void
  /** Judul project — alt text gambar. */
  projectTitle: string
  /** Override pola posisi (preview via ?fitur=kiri|kanan). */
  sideMode?: FeatureImageSideMode
}

/**
 * Daftar poin fitur selang-seling (zigzag) teks ↔ gambar:
 * - Item DENGAN gambar: grid 2 kolom, posisi gambar bergantian
 *   kiri/kanan antar item (zigzag dihitung hanya dari item bergambar,
 *   jadi polanya konsisten walau ada item teks-saja di antaranya).
 * - Item TANPA gambar: badge nomor aksen + teks, full width.
 * - Mobile/window sempit: semua jadi 1 kolom — gambar di atas teks.
 * Klik gambar → lightbox (hanya saat Mode Edit MATI).
 */
export default function FeatureItems({
  items,
  onOpenImage,
  projectTitle,
  sideMode,
}: FeatureItemsProps) {
  const { enabled: editMode } = useEditMode()
  const { lang } = useLanguage()

  // Nomor urut dipakai bersama (badge & aria) — posisi array + 1.
  const numbered = useMemo(
    () => items.map((item, i) => ({ item, num: i + 1 })),
    [items],
  )
  // Pola posisi gambar dihitung SEKALI di memo (tanpa mutasi saat
  // render — aturan React Compiler): zigzag = gambar item bergambar
  // PERTAMA di kiri, kedua di kanan, dst — item teks-saja tidak
  // menggeser pola; left/right = selalu di satu sisi yang sama.
  const mode = sideMode ?? FEATURE_IMAGE_SIDE
  const imageRightFlags = useMemo(
    () =>
      items.map((it, i) => {
        const has = it.image_url.trim() !== ''
        // Urutan item bergambar SEBELUM item ini (item teks-saja tidak
        // menggeser pola) — dihitung tanpa mutasi (aturan React Compiler).
        const seenBefore = items
          .slice(0, i)
          .filter((x) => x.image_url.trim() !== '').length
        return has && (mode === 'zigzag' ? seenBefore % 2 === 1 : mode === 'right')
      }),
    [items, mode],
  )

  return (
    <div className="space-y-12 sm:space-y-16">
      {numbered.map(({ item, num }, idx) => {
        const title = featureItemTitle(item, lang)
        const text = featureItemText(item, lang)
        const hasImage = item.image_url.trim() !== ''
        const imageRight = imageRightFlags[idx]

        return hasImage ? (
          <div
            key={item.id}
            className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10 lg:gap-14"
          >
            {/* Mobile: gambar SELALU di atas teks (order-1/order-2).
                Desktop (sm): posisi sesuai pola zigzag/kiri/kanan. */}
            <div
              className={
                imageRight
                  ? 'order-2 min-w-0 sm:order-1'
                  : 'order-2 min-w-0 sm:order-2'
              }
            >
              {title && (
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {title}
                </h3>
              )}
              <div className="leading-[1.8] text-muted whitespace-pre-line">
                {text}
              </div>
            </div>
            <div
              className={imageRight ? 'order-1 sm:order-2' : 'order-1 sm:order-1'}
              data-feature-image={item.id}
            >
              <button
                type="button"
                onClick={
                  editMode ? undefined : () => onOpenImage(item.image_url)
                }
                aria-label={`Perbesar gambar fitur ${num}`}
                className={`block w-full overflow-hidden rounded-xl border border-hairline bg-surface-2 transition-colors hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  /* Mode Edit: klik lightbox mati — efek zoom/cue tidak
                     dipasang supaya hover gambar tetap fokus ke edit. */
                  editMode ? '' : 'zoom-hover cursor-zoom-in'
                }`}
              >
                <SmoothImage
                  src={item.image_url}
                  alt={
                    title ||
                    `${projectTitle} — gambar fitur ${num}`
                  }
                  sizes="(min-width:640px) 50vw, 100vw"
                  className="block h-auto w-full"
                >
                  {!editMode && (
                    <>
                      <ZoomCue />
                      <ZoomCue variant="dot" />
                    </>
                  )}
                </SmoothImage>
              </button>
            </div>
          </div>
        ) : (
          <div
            key={item.id}
            className={`flex items-start gap-3 rounded-lg px-3.5 py-3 ${
              /* Latar selang-seling sangat tipis: item GENAP (urutan
                 ke-2, ke-4, …) dapat tint biru ±4% (token
                 --color-accent-faint) — ganjil transparan. */
              num % 2 === 0 ? 'bg-accent-faint' : ''
            } ${
              /* Garis pembatas antar item (item pertama tanpa garis)
                 — hairline-strong (lebih terang) supaya batas poin
                 lebih tegas. */
              num > 1 ? 'border-t border-hairline-strong' : ''
            }`}
          >
            <NumberBadge n={String(num)} />
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {title}
                </h3>
              )}
              <div className="leading-[1.8] text-muted whitespace-pre-line">
                {text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
