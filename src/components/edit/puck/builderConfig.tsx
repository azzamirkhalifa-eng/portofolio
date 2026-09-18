import type { ComponentConfig, Config } from '@puckeditor/core'
import {
  BUILDER_WIDTH_CLS,
  type BuilderAlign,
  type BuilderLang,
  type BuilderWidth,
} from '../../../types/builder'
import { elText, elTitle } from '../../../lib/builderData'
import { pick } from '../../../lib/i18n'
import SmoothImage from '../../ui/SmoothImage'
import Button from '../../ui/Button'
import { NumberBadge } from '../../ui/RichText'
import type { BuilderElement } from '../../../types/builder'
import ImageUploadField from './ImageUploadField'
import { safeHrefBuilder } from './safeHref'

/**
 * Config Puck — Visual Page Builder prototipe (section feature,
 * halaman detail project).
 *
 * Prinsip:
 * - Setiap `render` memakai token design system Tailwind yang ada
 *   (text-foreground, text-muted, border-hairline, rounded-lg, dst) —
 *   TIDAK ada CSS bebas, tema tidak bisa rusak dari builder.
 * - `lang` di-set via `setBuilderLang()` dari wrapper editor supaya
 *   preview di canvas mengikuti toggle EN/ID admin (renderer publik
 *   memakai useLanguage sendiri).
 * - Width/align disimpan sebagai props `_wb`/`_al` dan diterapkan
 *   lewat class Tailwind (BUILDER_WIDTH_CLS) — responsive by default.
 */

/** Bahasa render untuk canvas editor (di-set wrapper sebelum mount). */
let editorLang: BuilderLang = 'id'
export function setBuilderLang(lang: BuilderLang): void {
  editorLang = lang
}
function getLang(): BuilderLang {
  return editorLang
}

/** Props style bersama (panel kanan): lebar + perataan. */
type StyleProps = { _wb?: BuilderWidth; _al?: BuilderAlign }

/** Field width/align yang dipasang di semua komponen (panel kanan). */
const styleFields = {
  _wb: {
    type: 'select' as const,
    label: 'Lebar',
    options: [
      { label: 'Penuh', value: 'full' },
      { label: 'Lebar (5/6)', value: 'wide' },
      { label: 'Setengah', value: 'half' },
      { label: 'Sepertiga', value: 'small' },
    ],
  },
  _al: {
    type: 'radio' as const,
    label: 'Perataan',
    options: [
      { label: 'Kiri', value: 'left' },
      { label: 'Tengah', value: 'center' },
      { label: 'Kanan', value: 'right' },
    ],
  },
}

/** Class perataan dari prop _al. */
function alignCls(al?: string): string {
  return al === 'center' ? 'text-center' : al === 'right' ? 'text-right' : ''
}

/** Bentuk item content Puck (dipakai untuk hitung pola zigzag). */
type ContentItem = { type?: string; props?: Record<string, unknown> }

/**
 * Hitung urutan item bergambar SEBELUM elemen ini (untuk zigzag).
 * Sumber: objek `puck` di render props (appState.data.content = daftar
 * elemen aktual di canvas), jadi pola ikut benar saat admin menambah/
 * menghapus gambar atau mengurutkan ulang. Bila tidak tersedia,
 * kembalikan 0 (gambar di kiri) — degradasi aman.
 */
function seenImagesBefore(puck: unknown, myId: string | undefined): number {
  const content = (
    puck as { appState?: { data?: { content?: ContentItem[] } } } | undefined
  )?.appState?.data?.content
  if (!content || myId === undefined) return 0
  const myIdx = content.findIndex((el) => el?.props?.id === myId)
  if (myIdx <= 0) return 0
  return content
    .slice(0, myIdx)
    .filter(
      (el) => el?.type === 'Feature' && String(el?.props?.image_url ?? '').trim() !== '',
    ).length
}

/* ── Tipe props per elemen (kontrak data di builder_json) ─────────── */

type HeadingProps = { title?: string; title_en?: string; level?: 'h2' | 'h3' } & StyleProps
type TextProps = { text?: string; text_en?: string } & StyleProps
type ImageProps = { image_url?: string; image_alt?: string } & StyleProps
type ButtonElementProps = {
  title?: string
  title_en?: string
  href?: string
  variant?: 'primary' | 'ghost'
} & StyleProps
type FeatureProps = {
  title?: string
  title_en?: string
  text?: string
  text_en?: string
  image_url?: string
  side?: 'auto' | 'left' | 'right'
}

/* ── Elemen: Heading ──────────────────────────────────────────────── */

const heading: ComponentConfig<HeadingProps> = {
  fields: {
    title: { type: 'text', label: 'Judul (ID)' },
    title_en: { type: 'text', label: 'Judul (EN, kosong = pakai ID)' },
    level: {
      type: 'radio',
      label: 'Tingkat',
      options: [
        { label: 'Section (h2)', value: 'h2' },
        { label: 'Sub (h3)', value: 'h3' },
      ],
    },
    ...styleFields,
  },
  defaultProps: { title: '', title_en: '', level: 'h2', _wb: 'full', _al: 'left' },
  render: ({ title, title_en, level = 'h2', _wb = 'full', _al = 'left' }) => {
    const text = pick(title ?? '', title_en, getLang())
    return (
      <div className={`${BUILDER_WIDTH_CLS[_wb]} ${alignCls(_al)}`}>
        {level === 'h2' ? (
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {text}
          </h2>
        ) : (
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{text}</h3>
        )}
      </div>
    )
  },
}

/* ── Elemen: Text ─────────────────────────────────────────────────── */

const text: ComponentConfig<TextProps> = {
  fields: {
    text: { type: 'textarea', label: 'Teks (ID)' },
    text_en: { type: 'textarea', label: 'Teks (EN, kosong = pakai ID)' },
    ...styleFields,
  },
  defaultProps: { text: '', text_en: '', _wb: 'full', _al: 'left' },
  render: ({ text, text_en, _wb = 'full', _al = 'left' }) => {
    const body = pick(text ?? '', text_en, getLang())
    return (
      <div className={`${BUILDER_WIDTH_CLS[_wb]} ${alignCls(_al)}`}>
        <div className="whitespace-pre-line leading-[1.8] text-muted">{body}</div>
      </div>
    )
  },
}

/* ── Elemen: Image ────────────────────────────────────────────────── */

const image: ComponentConfig<ImageProps> = {
  fields: {
    image_url: {
      type: 'custom',
      label: 'Gambar',
      render: (p: { value?: string; onChange: (v: string) => void }) => (
        <ImageUploadField label="Gambar" value={p.value ?? ''} onChange={p.onChange} />
      ),
    },
    image_alt: { type: 'text', label: 'Alt text (deskripsi gambar)' },
    ...styleFields,
  },
  defaultProps: { image_url: '', image_alt: '', _wb: 'full', _al: 'left' },
  render: ({ image_url, image_alt, _wb = 'full' }) =>
    (image_url ?? '').trim() !== '' ? (
      <div className={BUILDER_WIDTH_CLS[_wb]}>
        <SmoothImage
          src={image_url ?? ''}
          alt={image_alt || 'Gambar'}
          sizes="(min-width:640px) 50vw, 100vw"
          className="block h-auto w-full rounded-lg border border-hairline object-contain"
        />
      </div>
    ) : (
      <div
        className={`${BUILDER_WIDTH_CLS[_wb]} rounded-lg border border-dashed border-hairline bg-surface-2 px-4 py-8 text-center font-mono text-xs text-muted`}
      >
        Belum ada gambar — pilih elemen ini lalu unggah di panel kanan
      </div>
    ),
}

/* ── Elemen: Button ───────────────────────────────────────────────── */

const button: ComponentConfig<ButtonElementProps> = {
  fields: {
    title: { type: 'text', label: 'Label tombol (ID)' },
    title_en: { type: 'text', label: 'Label (EN, kosong = pakai ID)' },
    href: { type: 'text', label: 'URL tujuan' },
    variant: {
      type: 'radio',
      label: 'Gaya',
      options: [
        { label: 'Utama', value: 'primary' },
        { label: 'Ghost', value: 'ghost' },
      ],
    },
    ...styleFields,
  },
  defaultProps: {
    title: '',
    title_en: '',
    href: '',
    variant: 'primary',
    _wb: 'full',
    _al: 'left',
  },
  render: ({ title, title_en, href, variant = 'primary', _wb = 'full', _al = 'left' }) => {
    const label = pick(title ?? '', title_en, getLang()) || 'Tombol'
    const url = safeHrefBuilder(href ?? '')
    return (
      <div className={`${BUILDER_WIDTH_CLS[_wb]} ${alignCls(_al)}`}>
        <Button href={url || undefined} variant={variant} disabled={!url}>
          {label}
        </Button>
      </div>
    )
  },
}

/* ── Elemen: Feature (poin fitur — kompatibel feature_items lama) ─── */

const feature: ComponentConfig<FeatureProps> = {
  fields: {
    title: { type: 'text', label: 'Judul poin (ID, opsional)' },
    title_en: { type: 'text', label: 'Judul (EN, kosong = pakai ID)' },
    text: { type: 'textarea', label: 'Teks poin (ID)' },
    text_en: { type: 'textarea', label: 'Teks (EN, kosong = pakai ID)' },
    image_url: {
      type: 'custom',
      label: 'Gambar pendukung',
      render: (p: { value?: string; onChange: (v: string) => void }) => (
        <ImageUploadField label="Gambar pendukung" value={p.value ?? ''} onChange={p.onChange} />
      ),
    },
    side: {
      type: 'radio',
      label: 'Posisi gambar (desktop)',
      options: [
        { label: 'Otomatis (zigzag)', value: 'auto' },
        { label: 'Kiri', value: 'left' },
        { label: 'Kanan', value: 'right' },
      ],
    },
  },
  defaultProps: {
    title: '',
    title_en: '',
    text: '',
    text_en: '',
    image_url: '',
    side: 'auto',
  },
  render: (p) => {
    const lang = getLang()
    const asEl: BuilderElement = {
      id: p.id ?? '',
      type: 'feature',
      props: p,
      style: { width: 'full', align: 'left' },
    }
    const title = elTitle(asEl, lang)
    const body = elText(asEl, lang)
    const hasImage = (p.image_url ?? '').trim() !== ''
    // Zigzag konsisten dengan renderer lama (FeatureItems.tsx):
    // pola dihitung dari urutan item bergambar SEBELUM item ini.
    const seen = seenImagesBefore(p.puck, p.id)
    const imageRight =
      hasImage &&
      (p.side === 'right' || (p.side === 'left' ? false : seen % 2 === 1))

    return hasImage ? (
      <div className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10 lg:gap-14">
        {/* Mobile: gambar SELALU di atas teks; desktop: sesuai pola. */}
        <div className={imageRight ? 'order-2 min-w-0 sm:order-1' : 'order-2 min-w-0 sm:order-2'}>
          {title !== '' && (
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          )}
          <div className="whitespace-pre-line leading-[1.8] text-muted">{body}</div>
        </div>
        <div className={imageRight ? 'order-1 sm:order-2' : 'order-1 sm:order-1'}>
          <SmoothImage
            src={p.image_url ?? ''}
            alt={title || 'Gambar fitur'}
            sizes="(min-width:640px) 50vw, 100vw"
            className="block h-auto w-full rounded-xl border border-hairline"
          />
        </div>
      </div>
    ) : (
      <div className="flex items-start gap-3">
        <NumberBadge n="•" />
        <div className="min-w-0 flex-1">
          {title !== '' && (
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          )}
          <div className="whitespace-pre-line leading-[1.8] text-muted">{body}</div>
        </div>
      </div>
    )
  },
}

/** Config Puck lengkap — tipe elemen yang muncul di sidebar kiri. */
export const builderConfig: Config = {
  components: {
    Heading: heading,
    Text: text,
    Image: image,
    Button: button,
    Feature: feature,
  },
}
