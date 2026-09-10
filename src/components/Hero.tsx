import { useEffect, useState, type CSSProperties } from 'react'
import Button from './ui/Button'
import SectionBox from './ui/SectionBox'
import InlineText from './edit/InlineText'
import InlineImage from './edit/InlineImage'
import PhotoSizeControls from './edit/PhotoSizeControls'
import PhotoFrame from './edit/PhotoFrame'
import TypographyPanel from './edit/TypographyPanel'
import { selectCls } from './edit/controls'
import { useEditMode } from '../context/EditModeContext'
import InlineTextBilingual from './edit/InlineTextBilingual'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'
import { updateProfile } from '../lib/mutations'
import TiltedAvatar from './fx/TiltedAvatar'
import type { Profile } from '../types'

type HeroProps = {
  profile: Profile | null
  loading: boolean
}

function HeroSkeleton() {
  return (
    <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
      <div className="animate-pulse">
        <div className="h-3 w-40 rounded bg-surface-2" />
        <div className="mt-6 h-16 w-3/4 rounded bg-surface-2 sm:h-20" />
        <div className="mt-6 h-5 w-full max-w-xl rounded bg-surface-2" />
        <div className="mt-10 flex gap-3">
          <div className="h-10 w-32 rounded-md bg-surface-2" />
          <div className="h-10 w-32 rounded-md bg-surface-2" />
        </div>
      </div>
      <div className="hidden animate-pulse lg:block">
        <div className="aspect-[4/5] rounded-2xl bg-surface-2" />
      </div>
    </div>
  )
}

/**
 * Visual foto profil (frame gradient hairline + glow + gambar/placeholder).
 * Dibungkus InlineImage oleh Hero supaya bisa di-upload langsung
 * saat Mode Edit aktif.
 */
function AvatarVisual({ profile }: { profile: Profile }) {
  const initial = profile.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="relative mx-auto flex justify-center">
      {/* Glow halus di belakang foto */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl"
      />

      {/* Frame: gradient hairline 1px supaya "menyala" di tepi atas.
          Foto tampil dengan rasio asli (tidak dipotong); frame
          mengikuti bentuk foto. */}
      <div className="relative w-fit rounded-2xl bg-gradient-to-b from-white/15 via-white/5 to-transparent p-px">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`Foto ${profile.name}`}
            className="block h-auto max-h-[70vh] w-auto max-w-full rounded-[calc(1rem-1px)] border border-white/5 object-contain"
          />
        ) : (
          <div className="flex aspect-[4/5] w-64 flex-col items-center justify-center gap-5 rounded-[calc(1rem-1px)] border border-white/5 bg-gradient-to-br from-surface to-surface-2 sm:w-72">
            <span className="font-mono text-7xl tracking-tight text-white/15">
              {initial}
            </span>
            <span className="rounded-sm border border-hairline bg-background/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-white/25">
              Foto Profil
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/** Teks tombol "Hubungi Saya" mengikuti bahasa aktif. */
function CtaContactText() {
  const { lang } = useLanguage()
  return <>{t(ui.hubungiSaya, lang)}</>
}

export default function Hero({ profile, loading }: HeroProps) {
  const { enabled } = useEditMode()
  // Preview ukuran foto saat slider Mode Edit digeser (live, sebelum
  // tersimpan ke DB). Reset tiap nilai profile ter-update (realtime).
  const [sizeOverride, setSizeOverride] = useState<
    { width: number; height: number } | null
  >(null)
  useEffect(() => {
    setSizeOverride(null)
  }, [profile?.updated_at])
  const heroSize =
    sizeOverride ?? {
      width: profile?.hero_photo_width ?? 420,
      height: profile?.hero_photo_height ?? 520,
    }

  return (
    // Kotak Hero kini UTUH: keempat sudut melengkung sama seperti section
    // lain, dengan jarak (mt-6/sm:mt-8) di bawah Navbar sticky supaya
    // sudut atasnya tidak "menyatu" dengan navbar. Padding atas tetap
    // lebih besar dari section lain karena ini section pertama.
    <SectionBox
      id="top"
      className="mt-6 pt-20 sm:mt-8 sm:pt-24 lg:pt-28"
    >
      {loading || !profile ? (
        <HeroSkeleton />
      ) : (
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Kolom kiri — teks */}
          <div className="relative">
            <p className="reveal font-mono text-xs uppercase tracking-[0.25em] text-accent">
              Portfolio — {new Date().getFullYear()}
            </p>

            <h1 className="hero-name-text mt-8 reveal font-extrabold leading-[0.95] tracking-tighter">
              <InlineText
                value={profile.name}
                trailing={<span className="text-accent">.</span>}
                ariaLabel="Edit nama"
                placeholder="Nama kamu…"
                onSave={async (v) => {
                  await updateProfile({ name: v })
                }}
              />
            </h1>

            <div
              className="hero-tagline-text mt-8 max-w-xl reveal leading-relaxed text-muted"
              style={{ animationDelay: '100ms' }}
            >
              <InlineTextBilingual
                valueId={profile.tagline}
                valueEn={profile.tagline_en ?? ''}
                onSaveId={async (v) => {
                  await updateProfile({ tagline: v })
                }}
                onSaveEn={async (v) => {
                  await updateProfile({ tagline_en: v })
                }}
                enabled={enabled}
                multiline
                ariaLabel="Edit tagline"
                placeholder="Tulis tagline singkat…"
                placeholderEn="Write a short tagline…"
              />
            </div>

            <div
              className="mt-12 flex reveal flex-wrap gap-3"
              style={{ animationDelay: '200ms' }}
            >
              <Button to="/#projects">
                <InlineTextBilingual
                  valueId={profile.hero_cta_text || 'Lihat Project'}
                  valueEn={profile.hero_cta_text_en || ''}
                  onSaveId={async (v) => {
                    await updateProfile({ hero_cta_text: v })
                  }}
                  onSaveEn={async (v) => {
                    await updateProfile({ hero_cta_text_en: v })
                  }}
                  enabled={enabled}
                  ariaLabel="Edit teks tombol"
                  placeholder="Teks tombol…"
                  placeholderEn="Button text…"
                />
              </Button>
              <Button to="/#contact" variant="ghost">
                <CtaContactText />
              </Button>
            </div>

            {/* Panel tipografi (khusus Mode Edit) — skala semua teks. */}
            {enabled && profile && (
              <TypographyPanel
                scales={{
                  hero_name_scale: profile.hero_name_scale ?? 100,
                  tagline_scale: profile.tagline_scale ?? 100,
                  section_title_scale: profile.section_title_scale ?? 100,
                  body_scale: profile.body_scale ?? 100,
                  card_title_scale: profile.card_title_scale ?? 100,
                  card_text_scale: profile.card_text_scale ?? 100,
                }}
                onError={(msg) => window.alert(msg)}
              />
            )}
          </div>

          {/* Kolom kanan — foto profil besar dengan efek tilt.
              Foto ada → TiltedCard; kosong → placeholder lama.
              Keduanya tetap dibungkus InlineImage supaya upload
              di Mode Edit bekerja seperti sebelumnya.
              Ukuran frame (px) diatur admin via slider Mode Edit
              (hero_photo_width/height); container tetap responsif
              (max-w-xs/sm) supaya tidak overflow di layar kecil. */}
          <div
            className="relative mx-auto w-full max-w-[min(100%,var(--photo-w))] lg:mt-0"
            style={{
              '--photo-w': `${heroSize.width}px`,
            } as CSSProperties}
          >
            {/* Bingkai gaya Canva: bentuk bingkai + drag fokus foto
                (khusus Mode Edit). Foto otomatis ter-crop cover. */}
            <PhotoFrame
              shape={profile?.hero_photo_shape ?? 'rounded'}
              focus={{
                x: profile?.hero_photo_focus_x ?? 50,
                y: profile?.hero_photo_focus_y ?? 50,
              }}
              editable={enabled}
              onFocusCommit={(f) =>
                void updateProfile({
                  hero_photo_focus_x: Math.round(f.x),
                  hero_photo_focus_y: Math.round(f.y),
                }).catch((err) =>
                  window.alert(
                    `Gagal menyimpan fokus foto: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
                  ),
                )
              }
            >
            <InlineImage
              src={profile.avatar_url}
              alt={`Foto ${profile.name}`}
              folder="avatars"
              uploadLabel="Ganti Foto Profil"
              shapeClass="rounded-2xl"
              onSave={async (url) => {
                await updateProfile({ avatar_url: url })
              }}
            >
              {profile.avatar_url ? (
                <TiltedAvatar
                  key={profile.avatar_url}
                  src={profile.avatar_url}
                  alt={`Foto ${profile.name}`}
                  captionText={profile.name}
                  maxWidth={heroSize.width}
                  maxHeight={heroSize.height}
                  fallback={<AvatarVisual profile={profile} />}
                />
              ) : (
                <AvatarVisual profile={profile} />
              )}
            </InlineImage>
            </PhotoFrame>

            {/* Slider ukuran foto (khusus Mode Edit) — tersimpan ke
                kolom hero_photo_width/height saat dilepas. */}
            {enabled && profile && (
              <PhotoSizeControls
                fieldPrefix="hero_photo"
                label="Ukuran Foto Hero"
                width={profile.hero_photo_width ?? 420}
                height={profile.hero_photo_height ?? 520}
                onPreview={setSizeOverride}
                onError={(msg) => window.alert(msg)}
              />
            )}
            {/* Pemilih bentuk bingkai (khusus Mode Edit). */}
            {enabled && profile && (
              <label className="mt-2 block rounded-lg border border-hairline bg-surface/90 px-3 py-2.5 backdrop-blur-sm">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                  Bentuk Bingkai
                </span>
                <select
                  className={selectCls}
                  value={profile.hero_photo_shape ?? 'rounded'}
                  onChange={async (e) => {
                    try {
                      await updateProfile({
                        hero_photo_shape: e.target.value as 'rounded' | 'square' | 'arch' | 'circle',
                      })
                    } catch (err) {
                      window.alert(
                        `Gagal menyimpan bentuk: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
                      )
                    }
                  }}
                >
                  <option value="rounded">Rounded</option>
                  <option value="square">Kotak</option>
                  <option value="arch">Arch</option>
                  <option value="circle">Bulat</option>
                </select>
              </label>
            )}
          </div>
        </div>
      )}
    </SectionBox>
  )
}
