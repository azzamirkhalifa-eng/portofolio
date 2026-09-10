import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/storage'
import { useProfile } from '../../hooks/useProfile'
import { Field, Feedback, inputCls } from './FormControls'

type FormState = {
  name: string
  tagline: string
  tagline_en: string
  hero_cta_text: string
  hero_cta_text_en: string
  about_title: string
  about_title_en: string
  about_text: string
  about_text_en: string
  avatar_url: string
  about_avatar_url: string
  about_photo_side: 'left' | 'right'
  projects_columns: number
  email: string
  github_url: string
  instagram_url: string
  linkedin_url: string
  twitter_url: string
}

const emptyForm: FormState = {
  name: '',
  tagline: '',
  tagline_en: '',
  hero_cta_text: 'Lihat Project',
  hero_cta_text_en: '',
  about_title: 'Tentang Saya',
  about_title_en: '',
  about_text: '',
  about_text_en: '',
  avatar_url: '',
  about_avatar_url: '',
  about_photo_side: 'left',
  projects_columns: 2,
  email: '',
  github_url: '',
  instagram_url: '',
  linkedin_url: '',
  twitter_url: '',
}

type FeedbackState = { status: 'success' | 'error'; message: string } | null

function ImagePicker({
  url,
  uploading,
  onPick,
}: {
  url: string
  uploading: boolean
  onPick: (file: File | undefined) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {url ? (
        <img
          src={url}
          alt="Preview foto"
          className="h-20 w-20 rounded-lg border border-hairline object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-hairline bg-surface-2 font-mono text-xs text-white/25">
          No Foto
        </div>
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:border-white/25 hover:bg-surface-2">
        {uploading ? 'Uploading…' : 'Upload Foto'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
    </div>
  )
}

export default function ProfileSection() {
  const { profile, loading } = useProfile()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'hero' | 'about' | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const initialized = useRef(false)

  // Isi form dari database sekali saat data pertama kali tersedia.
  useEffect(() => {
    if (profile && !initialized.current) {
      initialized.current = true
      const { id, updated_at, ...rest } = profile
      setForm({
        ...emptyForm,
        ...rest,
        about_photo_side: rest.about_photo_side ?? 'left',
        projects_columns: rest.projects_columns ?? 2,
      })
    }
  }, [profile])

  const set =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    const { error } = await supabase.from('profile').update(form).eq('id', 1)

    setSaving(false)
    if (error) {
      setFeedback({
        status: 'error',
        message: `Gagal menyimpan: ${error.message}`,
      })
    } else {
      setFeedback({
        status: 'success',
        message: 'Berhasil disimpan — halaman publik langsung ter-update.',
      })
    }
  }

  async function handleUpload(target: 'hero' | 'about', file: File | undefined) {
    if (!file) return
    setUploading(target)
    setFeedback(null)
    try {
      const url = await uploadImage(file, 'avatars')
      setForm((f) => ({
        ...f,
        [target === 'hero' ? 'avatar_url' : 'about_avatar_url']: url,
      }))
      setFeedback({
        status: 'success',
        message: 'Foto ter-upload. Klik "Simpan Perubahan" untuk menyimpannya.',
      })
    } catch (err) {
      setFeedback({
        status: 'error',
        message: `Upload gagal: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      })
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-surface-2" />
        <div className="h-64 rounded-lg border border-hairline bg-surface" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Profile & Hero<span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Nama, tagline, CTA, about, foto, email & link sosmed — tersimpan ke
          tabel{' '}
          <code className="font-mono text-accent">profile</code>. (Halaman
          publik juga bisa diedit langsung lewat Mode Edit.)
        </p>
      </div>

      {/* Hero */}
      <section className="space-y-4 rounded-lg border border-hairline bg-surface p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Hero
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama">
            <input
              className={inputCls}
              value={form.name}
              onChange={set('name')}
              placeholder="Nama Kamu"
            />
          </Field>
          <Field label="Tagline (Indonesia)">
            <input
              className={inputCls}
              value={form.tagline}
              onChange={set('tagline')}
              placeholder="Tagline singkat di bawah nama"
            />
          </Field>
          <Field label="Tagline (English)">
            <input
              className={inputCls}
              value={form.tagline_en}
              onChange={set('tagline_en')}
              placeholder="Kosong = pakai versi Indonesia"
            />
          </Field>
          <Field label="Teks Tombol CTA (Indonesia)">
            <input
              className={inputCls}
              value={form.hero_cta_text}
              onChange={set('hero_cta_text')}
              placeholder="Lihat Project"
            />
          </Field>
          <Field label="Teks Tombol CTA (English)">
            <input
              className={inputCls}
              value={form.hero_cta_text_en}
              onChange={set('hero_cta_text_en')}
              placeholder="Kosong = pakai versi Indonesia"
            />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            Foto Profil (Hero)
          </span>
          <ImagePicker
            url={form.avatar_url}
            uploading={uploading === 'hero'}
            onPick={(f) => void handleUpload('hero', f)}
          />
        </div>
      </section>

      {/* About */}
      <section className="space-y-4 rounded-lg border border-hairline bg-surface p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          About
        </h2>

        <div>
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            Foto Kartu About (bisa berbeda dari foto Hero)
          </span>
          <ImagePicker
            url={form.about_avatar_url}
            uploading={uploading === 'about'}
            onPick={(f) => void handleUpload('about', f)}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-muted">
            Posisi foto:
            <select
              className={inputCls}
              value={form.about_photo_side}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  about_photo_side: e.target.value as 'left' | 'right',
                }))
              }
            >
              <option value="left">Kiri</option>
              <option value="right">Kanan</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Judul About (Indonesia)">
            <input
              className={inputCls}
              value={form.about_title}
              onChange={set('about_title')}
              placeholder="Tentang Saya"
            />
          </Field>
          <Field label="Judul About (English)">
            <input
              className={inputCls}
              value={form.about_title_en}
              onChange={set('about_title_en')}
              placeholder="Kosong = pakai versi Indonesia"
            />
          </Field>
          <Field label="Deskripsi About (Indonesia)">
            <textarea
              className={`${inputCls} min-h-32 resize-y`}
              value={form.about_text}
              onChange={set('about_text')}
              placeholder="Cerita singkat tentang kamu…"
            />
          </Field>
          <Field label="Deskripsi About (English)">
            <textarea
              className={`${inputCls} min-h-32 resize-y`}
              value={form.about_text_en}
              onChange={set('about_text_en')}
              placeholder="Kosong = pakai versi Indonesia"
            />
          </Field>
        </div>
        <p className="text-xs text-white/25">
          Versi English yang kosong otomatis menampilkan versi Indonesia di
          halaman berbahasa English (fallback).
        </p>
      </section>

      {/* Tampilan Projects */}
      <section className="space-y-4 rounded-lg border border-hairline bg-surface p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Tampilan Projects
        </h2>
        <Field label="Jumlah kolom grid (1-3)">
          <select
            className={inputCls}
            value={form.projects_columns}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                projects_columns: Number(e.target.value),
              }))
            }
          >
            <option value={1}>1 kolom</option>
            <option value={2}>2 kolom</option>
            <option value={3}>3 kolom</option>
          </select>
        </Field>
      </section>

      {/* Contact */}
      <section className="space-y-4 rounded-lg border border-hairline bg-surface p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Contact & Sosial Media
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={set('email')}
              placeholder="kamu@email.com"
            />
          </Field>
          <div className="hidden sm:block" />
          <Field label="GitHub URL">
            <input
              className={inputCls}
              value={form.github_url}
              onChange={set('github_url')}
              placeholder="https://github.com/username"
            />
          </Field>
          <Field label="Instagram URL">
            <input
              className={inputCls}
              value={form.instagram_url}
              onChange={set('instagram_url')}
              placeholder="https://instagram.com/username"
            />
          </Field>
          <Field label="LinkedIn URL">
            <input
              className={inputCls}
              value={form.linkedin_url}
              onChange={set('linkedin_url')}
              placeholder="https://linkedin.com/in/username"
            />
          </Field>
          <Field label="Twitter / X URL">
            <input
              className={inputCls}
              value={form.twitter_url}
              onChange={set('twitter_url')}
              placeholder="https://x.com/username"
            />
          </Field>
        </div>
        <p className="text-xs text-white/25">
          Kosongkan link yang tidak dipakai — otomatis disembunyikan di halaman
          publik.
        </p>
      </section>

      <Feedback status={feedback?.status ?? null} message={feedback?.message ?? null} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
