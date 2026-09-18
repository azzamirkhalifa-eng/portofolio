import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import SectionLabel from './ui/SectionLabel'
import SectionBox from './ui/SectionBox'
import TiltedAvatar from './fx/TiltedAvatar'
import InlineText from './edit/InlineText'
import InlineTextBilingual from './edit/InlineTextBilingual'
import InlineImage from './edit/InlineImage'
import { MiniBtn, selectCls } from './edit/controls'
import PhotoSizeControls from './edit/PhotoSizeControls'
import PhotoFrame from './edit/PhotoFrame'
import { useEditMode } from '../context/EditModeContext'
import RichTextBilingual from './edit/RichTextBilingual'
import {
  addSkill,
  deleteSkill,
  renameSkill,
  swapPositions,
  updateProfile,
  updateSkillProficiency,
} from '../lib/mutations'
import type { Profile, Skill } from '../types'
import { frameDimsLabel } from '../lib/photoDims'

type AboutProps = {
  profile: Profile | null
  skills: Skill[]
  loading: boolean
}

function AboutSkeleton() {
  return (
    <div className="mt-10 grid animate-pulse gap-8 sm:grid-cols-[10rem_1fr]">
      <div className="h-40 w-40 rounded-lg bg-surface-2" />
      <div className="space-y-4">
        <div className="h-6 w-1/3 rounded bg-surface-2" />
        <div className="h-4 w-full rounded bg-surface-2" />
        <div className="h-4 w-5/6 rounded bg-surface-2" />
      </div>
    </div>
  )
}
/** Placeholder foto About (inisial) — tampil saat foto kosong. */
function AboutPhotoFallback({ initials }: { initials: string }) {
  return (
    <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-hairline bg-gradient-to-br from-surface to-surface-2 font-mono text-5xl text-accent/60">
      {initials}
    </div>
  )
}

/** Satu bar skill: nama + persentase + progress bar (animasi saat masuk layar). */
function SkillBar({ skill, index }: { skill: Skill; index: number }) {
  const pct = Math.max(0, Math.min(100, skill.proficiency ?? 0))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{skill.label}</span>
        <span className="font-mono text-xs text-muted">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-track">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
            delay: (index % 4) * 0.1,
          }}
        />
      </div>
    </div>
  )
}

function SkillProgressList({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) return null
  return (
    <div className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
      {skills.map((skill, i) => (
        <SkillBar key={skill.id} skill={skill} index={i} />
      ))}
    </div>
  )
}

/** Slider persentase skill — disimpan saat penggeseran selesai (bukan tiap gerakan). */
function ProficiencyControl({
  skill,
  onSave,
}: {
  skill: Skill
  onSave: (v: number) => Promise<void>
}) {
  const [value, setValue] = useState(skill.proficiency ?? 0)

  // Sinkron dari luar (mis. hasil realtime) hanya saat tidak menggeser.
  useEffect(() => {
    setValue(skill.proficiency ?? 0)
  }, [skill.proficiency])

  function commit() {
    if (value !== (skill.proficiency ?? 0)) {
      void onSave(value)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={`Persentase ${skill.label}`}
        onChange={(e) => setValue(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={(e) => {
          if (
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'Home' ||
            e.key === 'End'
          ) {
            commit()
          }
        }}
        className="min-w-0 flex-1 accent-accent"
      />
      <span className="w-10 shrink-0 text-right font-mono text-xs text-accent">
        {value}%
      </span>
    </div>
  )
}

function SkillEditor({
  skills,
  onToastError,
}: {
  skills: Skill[]
  onToastError: (msg: string) => void
}) {
  const [newLabel, setNewLabel] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>, failMsg: string) {
    setBusy(true)
    try {
      await action()
    } catch (err) {
      onToastError(`${failMsg}: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    const last = skills[skills.length - 1]
    await run(
      () => addSkill(label, (last?.position ?? 0) + 1),
      'Gagal menambah skill',
    )
    setNewLabel('')
  }

  return (
    <div className="mt-3 space-y-2">
      {skills.length === 0 && (
        <p className="text-sm text-white/25">Belum ada skill.</p>
      )}
      {skills.map((skill, idx) => (
        <div
          key={skill.id}
          className="rounded-lg border border-hairline bg-surface px-2 py-2"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <MiniBtn
                title="Naikkan urutan"
                disabled={idx === 0 || busy}
                onClick={() =>
                  void run(
                    () => swapPositions('skills', skill, skills[idx - 1]),
                    'Gagal mengubah urutan',
                  )
                }
              >
                ↑
              </MiniBtn>
              <MiniBtn
                title="Turunkan urutan"
                disabled={idx === skills.length - 1 || busy}
                onClick={() =>
                  void run(
                    () => swapPositions('skills', skill, skills[idx + 1]),
                    'Gagal mengubah urutan',
                  )
                }
              >
                ↓
              </MiniBtn>
            </div>

            <InlineText
              className="min-w-0 flex-1 font-mono text-sm"
              value={skill.label}
              placeholder="Nama skill…"
              ariaLabel="Edit nama skill"
              onSave={async (v) => {
                await renameSkill(skill.id, v.trim())
              }}
            />

            <MiniBtn
              title="Hapus skill"
              tone="danger"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Hapus skill "${skill.label}"?`)) {
                  void run(
                    () => deleteSkill(skill.id),
                    'Gagal menghapus skill',
                  )
                }
              }}
            >
              ✕
            </MiniBtn>
          </div>

          {/* Persentase penguasaan (0-100) — disimpan saat selesai menggeser */}
          <div className="mt-2 pl-9 pr-1">
            <ProficiencyControl
              skill={skill}
              onSave={(v) =>
                run(
                  () => updateSkillProficiency(skill.id, v),
                  'Gagal menyimpan persentase',
                )
              }
            />
          </div>
        </div>
      ))}


      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
        <input
          className="w-full flex-1 rounded-md border border-hairline bg-surface-3 px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-white/45 focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Skill baru (misal: Next.js)"
        />
        <button
          type="submit"
          disabled={busy || !newLabel.trim()}
          className="shrink-0 rounded-md bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Tambah
        </button>
      </form>
    </div>
  )
}

export default function About({ profile, skills, loading }: AboutProps) {
  const { enabled, toast } = useEditMode()
  const initials =
    (profile?.name ?? '?').trim().charAt(0).toUpperCase() || '?'
  // Preview ukuran frame kartu saat slider Mode Edit digeser (live,
  // sebelum tersimpan). Reset tiap nilai profile ter-update (realtime).
  const [sizeOverride, setSizeOverride] = useState<
    { width: number; height: number } | null
  >(null)
  useEffect(() => {
    setSizeOverride(null)
  }, [profile?.updated_at])
  const aboutSize =
    sizeOverride ?? {
      width: profile?.about_photo_width ?? 340,
      height: profile?.about_photo_height ?? 420,
    }

  if (loading) {
    return (
      <SectionBox id="about">
        <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
        <AboutSkeleton />
      </SectionBox>
    )
  }

  const side = profile?.about_photo_side ?? 'left'
  const photoRight = side === 'right'

  return (
    <SectionBox id="about" className="isolate">
      {/* Glow aksen sangat halus di pojok kanan atas (dekorasi TAHAP 2) */}
      <div
        aria-hidden
        className="bg-glow-accent pointer-events-none absolute -right-24 -top-20 -z-10 h-96 w-96 select-none opacity-80"
      />
      {/* Header section + kontrol posisi foto (edit mode) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel index="01">About</SectionLabel>
        {enabled && profile && (
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            Posisi foto
            <select
              className={selectCls}
              value={side}
              onChange={async (e) => {
                const next = e.target.value as 'left' | 'right'
                try {
                  await updateProfile({ about_photo_side: next })
                } catch (err) {
                  toast(
                    'error',
                    `Gagal menyimpan: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
                  )
                }
              }}
            >
              <option value="left">Kiri</option>
              <option value="right">Kanan</option>
            </select>
          </label>
        )}
      </div>

      <div className="mt-14 grid items-start gap-8 sm:grid-cols-[1fr_auto] sm:gap-12">
        {/* Foto About dengan efek TiltedCard (SAMA seperti di Hero).
            Foto dari kolom about_avatar_url (bisa diganti admin lewat
            dashboard atau klik area foto saat Mode Edit). */}
        {/* Pembungkus foto: lebar aktual mengikuti bingkai (slider, atau
            bingkai hasil crop bila foto ber-token rasio). */}
        <div
          className={`${photoRight ? 'sm:order-2' : ''} sm:sticky sm:top-24 sm:self-start`}
          style={
            {
              width: `min(100%, var(--photo-w))`,
              marginInline: 'auto',
              '--photo-w': `${aboutSize.width}px`,
            } as CSSProperties
          }
        >
          {/* Bingkai gaya Canva: bentuk bingkai + drag fokus foto
              (khusus Mode Edit) — sama seperti foto Hero. */}
          <PhotoFrame
            shape={profile?.about_photo_shape ?? 'rounded'}
            focus={{
              x: profile?.about_photo_focus_x ?? 50,
              y: profile?.about_photo_focus_y ?? 50,
            }}
            editable={enabled}
            onFocusCommit={(f) =>
              void updateProfile({
                about_photo_focus_x: Math.round(f.x),
                about_photo_focus_y: Math.round(f.y),
              }).catch((err) =>
                toast(
                  'error',
                  `Gagal menyimpan fokus foto: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
                ),
              )
            }
          >
          <InlineImage
            src={profile?.about_avatar_url ?? ''}
            alt={`Foto ${profile?.name ?? ''}`}
            folder="avatars"
            uploadLabel="Ganti Foto About"
            shapeClass="rounded-lg"
            cropContext="about"
            cropTitle="Foto About"
            onSave={async (url) => {
              await updateProfile({ about_avatar_url: url })
            }}
          >
            {profile?.about_avatar_url || profile?.avatar_url ? (
              <TiltedAvatar
                src={profile?.about_avatar_url || profile?.avatar_url || ''}
                alt={`Foto ${profile?.name ?? ''}`}
                captionText={profile?.name ?? ''}
                fallback={<AboutPhotoFallback initials={initials} />}
                maxWidth={aboutSize.width}
                maxHeight={aboutSize.height}
              />
            ) : (
              <AboutPhotoFallback initials={initials} />
            )}
          </InlineImage>
          </PhotoFrame>

          {/* Slider ukuran foto (khusus Mode Edit) — tersimpan ke
              kolom about_photo_width/height saat dilepas. */}
          {enabled && profile && (
            <PhotoSizeControls
              fieldPrefix="about_photo"
              label={`Ukuran Foto About — ${frameDimsLabel(
                profile?.about_avatar_url || profile?.avatar_url,
                aboutSize.width,
                aboutSize.height,
              )}`}
              width={profile.about_photo_width ?? 340}
              height={profile.about_photo_height ?? 420}
              onPreview={setSizeOverride}
              onError={(msg) => toast('error', msg)}
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
                value={profile.about_photo_shape ?? 'rounded'}
                onChange={async (e) => {
                  try {
                    await updateProfile({
                      about_photo_shape: e.target.value as 'rounded' | 'square' | 'arch' | 'circle',
                    })
                  } catch (err) {
                    toast(
                      'error',
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

        {/* Teks About + skill */}
        <div className={`min-w-0 ${photoRight ? 'sm:order-1' : ''}`}>
          <h2 className="section-title-text mt-14 font-bold tracking-tight sm:mt-0">
            <InlineTextBilingual
              valueId={profile?.about_title || 'Tentang Saya'}
              valueEn={profile?.about_title_en ?? ''}
              onSaveId={async (v) => {
                await updateProfile({ about_title: v })
              }}
              onSaveEn={async (v) => {
                await updateProfile({ about_title_en: v })
              }}
              enabled={enabled}
              ariaLabel="Edit judul About"
              placeholder="Judul section…"
              placeholderEn="Section title…"
            />
          </h2>

          <div className="body-text mt-6 leading-[1.8] text-muted">
            <RichTextBilingual
              valueId={profile?.about_text ?? ''}
              valueEn={profile?.about_text_en ?? ''}
              onSaveId={async (v) => {
                await updateProfile({ about_text: v })
              }}
              onSaveEn={async (v) => {
                await updateProfile({ about_text_en: v })
              }}
              enabled={enabled}
              multiline
              ariaLabel="Edit deskripsi About"
              placeholder="Cerita singkat tentang kamu — apa yang kamu kerjakan, suka, dan kuasai…"
              placeholderEn="A short story about you — what you do, like, and master…"
            />
          </div>

          <div className="mt-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Skills & Tools
            </p>
            {enabled ? (
<SkillEditor
    skills={skills}
    onToastError={(msg) => toast('error', msg)}
  />
            ) : (
              <SkillProgressList skills={skills} />
            )}
          </div>
        </div>
      </div>
    </SectionBox>
  )
}