import { useState, type FormEvent } from 'react'
import { uploadImage } from '../../lib/storage'
import { useAchievements } from '../../hooks/useAchievements'
import { useAchievementCategories } from '../../hooks/useAchievementCategories'
import AchievementCategoryManager from '../edit/AchievementCategoryManager'
import { GalleryEditor } from '../edit/DetailEditors'
import {
  createAchievement,
  deleteAchievement,
  swapAchievements,
  updateAchievement,
  type AchievementFields,
} from '../../lib/mutations'
import { Field, Feedback, inputCls } from './FormControls'
import type { Achievement } from '../../types'

type FeedbackState = { status: 'success' | 'error'; message: string } | null

function toFormState(a: Achievement | null): AchievementFields {
  return {
    title: a?.title ?? '',
    issuer: a?.issuer ?? '',
    year: a?.year ?? '',
    image_url: a?.image_url ?? '',
    description: a?.description ?? '',
    category_id: a?.category_id ?? null,
    featured: a?.featured ?? true,
    slug: a?.slug ?? '',
    full_description: a?.full_description ?? '',
    gallery: a?.gallery ?? [],
    title_en: a?.title_en ?? '',
    description_en: a?.description_en ?? '',
    full_description_en: a?.full_description_en ?? '',
    issuer_en: a?.issuer_en ?? '',
  }
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded border border-hairline text-muted transition-colors hover:border-white/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/**
 * Form tambah/edit pencapaian: identitas (judul, penyelenggara, tahun,
 * kategori), foto sertifikat, deskripsi singkat (kartu) + cerita
 * lengkap (halaman detail), galeri foto, dan pilihan tampil di beranda.
 */
function AchievementForm({
  initial,
  categories,
  busy,
  onCancel,
  onSave,
  onFeedback,
}: {
  initial: Achievement | null
  categories: ReturnType<typeof useAchievementCategories>['categories']
  busy: boolean
  onCancel: () => void
  onSave: (fields: AchievementFields) => Promise<void>
  onFeedback: (fb: FeedbackState) => void
}) {
  const [state, setState] = useState<AchievementFields>(() =>
    toFormState(initial),
  )
  const [uploading, setUploading] = useState(false)

  function set<K extends keyof AchievementFields>(
    key: K,
    value: AchievementFields[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'achievements')
      set('image_url', url)
      onFeedback({
        status: 'success',
        message: 'Foto ter-upload. Klik "Simpan Pencapaian" untuk menyimpannya.',
      })
    } catch (err) {
      onFeedback({
        status: 'error',
        message: `Upload foto gagal: ${
          err instanceof Error ? err.message : 'terjadi kesalahan.'
        }`,
      })
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!state.title.trim()) return
    void onSave({
      ...state,
      title: state.title.trim(),
      issuer: state.issuer.trim(),
      issuer_en: state.issuer_en.trim(),
      year: state.year.trim(),
      image_url: state.image_url.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-accent/30 bg-surface p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {initial ? `Edit Pencapaian #${initial.id}` : 'Pencapaian Baru'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Batal ✕
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul (ID / EN — kosongkan EN = pakai versi ID)">
          <div className="grid gap-2">
            <input
              className={`${inputCls} border-accent/30`}
              value={state.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="ID — misal: Juara 1 Hackathon Nasional"
              required
            />
            <input
              className={inputCls}
              value={state.title_en}
              onChange={(e) => set('title_en', e.target.value)}
              placeholder="EN — e.g. 1st Place National Hackathon"
            />
          </div>
        </Field>
        <Field label="Penyelenggara">
          <div className="grid gap-2">
            <input
              className={inputCls}
              value={state.issuer}
              onChange={(e) => set('issuer', e.target.value)}
              placeholder="misal: Dicoding, Kominfo, dsb."
            />
            <input
              className={inputCls}
              value={state.issuer_en}
              onChange={(e) => set('issuer_en', e.target.value)}
              placeholder="English — kosong = pakai versi Indonesia"
            />
          </div>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tahun">
          <input
            className={inputCls}
            value={state.year}
            onChange={(e) => set('year', e.target.value)}
            placeholder="misal: 2025"
          />
        </Field>
        <Field label="Kategori">
          <select
            className={inputCls}
            value={state.category_id ?? ''}
            onChange={(e) =>
              set(
                'category_id',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
          >
            <option value="">— Tanpa kategori —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deskripsi singkat (kartu) — ID / EN">
          <div className="grid gap-2">
            <textarea
              className={`${inputCls} min-h-20 resize-y border-accent/30`}
              value={state.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="ID — ringkasan yang tampil di kartu."
            />
            <textarea
              className={`${inputCls} min-h-20 resize-y`}
              value={state.description_en}
              onChange={(e) => set('description_en', e.target.value)}
              placeholder="EN — short summary shown on the card."
            />
          </div>
        </Field>
        <Field label="Cerita lengkap (halaman detail) — ID / EN">
          <div className="grid gap-2">
            <textarea
              className={`${inputCls} min-h-20 resize-y border-accent/30`}
              value={state.full_description}
              onChange={(e) => set('full_description', e.target.value)}
              placeholder="ID — cerita penuh: proses, tantangan, hasil…"
            />
            <textarea
              className={`${inputCls} min-h-20 resize-y`}
              value={state.full_description_en}
              onChange={(e) => set('full_description_en', e.target.value)}
              placeholder="EN — full story: process, challenges, results…"
            />
          </div>
        </Field>
      </div>

      {/* Foto sertifikat utama */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Foto Sertifikat (utama)
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {state.image_url ? (
            <img
              src={state.image_url}
              alt="Foto sertifikat"
              className="h-20 w-36 rounded-md border border-hairline object-cover"
            />
          ) : (
            <div className="flex h-20 w-36 items-center justify-center rounded-md border border-hairline bg-surface-2 font-mono text-[11px] text-white/25">
              No Foto
            </div>
          )}
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:border-white/25 hover:bg-surface-2">
              {uploading ? 'Uploading…' : 'Upload Foto Sertifikat'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void handleUpload(e.target.files?.[0])}
              />
            </label>
            <input
              className={`${inputCls} mt-2`}
              value={state.image_url}
              onChange={(e) => set('image_url', e.target.value)}
              placeholder="…atau tempel URL gambar langsung di sini"
            />
          </div>
        </div>
      </div>

      {/* Galeri foto halaman detail */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Galeri Foto (halaman detail)
        </span>
        <GalleryEditor
          images={state.gallery}
          onChange={(next) => set('gallery', next)}
          folder="achievements"
          cropContext="achievement"
          cropTitle="Foto Galeri Achievement"
        />
      </div>

      {/* Tampil di beranda + alamat slug */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tampil di beranda">
          <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-muted">
            <input
              type="checkbox"
              checked={state.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Muncul di cuplikan beranda
          </label>
        </Field>
        <Field label="Alamat halaman detail">
          <input
            className={inputCls}
            value={state.slug ?? ''}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="kosongkan = otomatis dari judul"
          />
        </Field>
      </div>
      <p className="font-mono text-[11px] text-white/35">
        Halaman: /achievements/{state.slug?.trim() || 'otomatis-dari-judul'}
      </p>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={busy || uploading || !state.title.trim()}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? 'Menyimpan…' : 'Simpan Pencapaian'}
        </button>
        <span className="font-mono text-[11px] text-white/30">
          Langsung tampil di section Pencapaian halaman utama
        </span>
      </div>
    </form>
  )
}

/**
 * Tab dashboard "Pencapaian": kelola sertifikat (tambah/edit/hapus/
 * urutkan), pilih yang tampil di beranda (featured), dan kelola kategori.
 */
export default function AchievementsSection() {
  const { achievements, loading } = useAchievements()
  const { categories } = useAchievementCategories()
  /** null = tutup form; 'new' = tambah; angka = edit id tersebut. */
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [manageCats, setManageCats] = useState(false)

  const catName = new Map(categories.map((c) => [c.id, c.name]))

  async function handleSave(fields: AchievementFields, targetId: number | 'new') {
    setBusy(true)
    setFeedback(null)
    try {
      if (targetId === 'new') {
        const last = achievements[achievements.length - 1]
        await createAchievement(fields, (last?.position ?? 0) + 1)
      } else {
        await updateAchievement(targetId, fields)
      }
      setEditingId(null)
      setFeedback({
        status: 'success',
        message:
          targetId === 'new'
            ? 'Pencapaian ditambahkan — langsung tampil di halaman publik.'
            : 'Perubahan disimpan — langsung tampil di halaman publik.',
      })
    } catch (err) {
      setFeedback({
        status: 'error',
        message: `Gagal menyimpan: ${
          err instanceof Error ? err.message : 'terjadi kesalahan.'
        }`,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(item: Achievement) {
    if (!confirm(`Hapus "${item.title || 'pencapaian tanpa judul'}"?`)) return
    setBusy(true)
    setFeedback(null)
    try {
      await deleteAchievement(item.id)
      setFeedback({ status: 'success', message: 'Pencapaian dihapus.' })
    } catch (err) {
      setFeedback({
        status: 'error',
        message: `Gagal menghapus: ${
          err instanceof Error ? err.message : 'terjadi kesalahan.'
        }`,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleMove(item: Achievement, dir: -1 | 1) {
    const idx = achievements.findIndex((a) => a.id === item.id)
    const target = achievements[idx + dir]
    if (!target) return
    setBusy(true)
    setFeedback(null)
    try {
      await swapAchievements(item, target)
      setFeedback({ status: 'success', message: 'Urutan disimpan.' })
    } catch (err) {
      setFeedback({
        status: 'error',
        message: `Gagal mengubah urutan: ${
          err instanceof Error ? err.message : 'terjadi kesalahan.'
        }`,
      })
    } finally {
      setBusy(false)
    }
  }

  /** Toggle cepat tampil/tidak di beranda, langsung dari daftar. */
  async function handleToggleFeatured(item: Achievement) {
    setBusy(true)
    setFeedback(null)
    try {
      await updateAchievement(item.id, { featured: !item.featured })
      setFeedback({
        status: 'success',
        message: item.featured
          ? 'Pencapaian disembunyikan dari beranda (tetap ada di halaman Pencapaian).'
          : 'Pencapaian ditampilkan di beranda.',
      })
    } catch (err) {
      setFeedback({
        status: 'error',
        message: `Gagal mengubah: ${
          err instanceof Error ? err.message : 'terjadi kesalahan.'
        }`,
      })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-lg border border-hairline bg-surface" />
    )
  }

  const editing = achievements.find((a) => a.id === editingId) ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Pencapaian<span className="text-accent">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Kelola sertifikat &amp; pencapaian: pilih yang tampil di beranda
            (featured), sisanya khusus di halaman Pencapaian. Klik kartu di
            halaman publik untuk buka halaman detail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setManageCats((v) => !v)}
            className="rounded-md border border-hairline px-3 py-2 text-sm text-foreground transition-colors hover:border-white/25 hover:bg-surface-2"
          >
            {manageCats ? 'Tutup Kategori' : 'Kelola Kategori'}
          </button>
          <button
            type="button"
            onClick={() => setEditingId(editingId === 'new' ? null : 'new')}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {editingId === 'new' ? 'Batal Tambah' : '+ Tambah Pencapaian'}
          </button>
        </div>
      </div>

      <Feedback status={feedback?.status ?? null} message={feedback?.message ?? null} />

      {manageCats && <AchievementCategoryManager categories={categories} />}

      {editingId !== null && (
        <AchievementForm
          key={editingId === 'new' ? 'new' : (editing?.id ?? 'missing')}
          initial={editing}
          categories={categories}
          busy={busy}
          onCancel={() => setEditingId(null)}
          onSave={(fields) => handleSave(fields, editingId)}
          onFeedback={setFeedback}
        />
      )}

      {/* Daftar pencapaian */}
      <div className="space-y-2">
        {achievements.length === 0 && editingId === null && (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
            Belum ada pencapaian. Klik "+ Tambah Pencapaian" untuk mulai.
          </p>
        )}

        {achievements.map((item, idx) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface p-3"
          >
            <div className="flex flex-col gap-1.5">
              <ArrowButton
                label="Naikkan urutan"
                disabled={idx === 0 || busy}
                onClick={() => void handleMove(item, -1)}
              >
                ↑
              </ArrowButton>
              <ArrowButton
                label="Turunkan urutan"
                disabled={idx === achievements.length - 1 || busy}
                onClick={() => void handleMove(item, 1)}
              >
                ↓
              </ArrowButton>
            </div>

            {item.image_url ? (
              <img
                src={item.image_url}
                alt=""
                className="h-14 w-24 rounded-md border border-hairline object-cover"
              />
            ) : (
              <div className="flex h-14 w-24 items-center justify-center rounded-md border border-hairline bg-surface-2 font-mono text-[10px] text-white/25">
                No Img
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {item.title || '(tanpa judul)'}
                {!item.featured && (
                  <span className="ml-2 rounded-sm border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/30">
                    tidak di beranda
                  </span>
                )}
              </p>
              <p className="truncate font-mono text-xs text-muted">
                pos {item.position} ·{' '}
                {item.category_id ? catName.get(item.category_id) ?? '?' : 'tanpa kategori'}
                {item.issuer ? ` · ${item.issuer}` : ''}
                {item.year ? ` · ${item.year}` : ''} ·{' '}
                {(item.gallery ?? []).length} galeri · /achievements/{item.slug ?? '…'}
              </p>
            </div>

            <div className="flex gap-2">
              {/* Toggle cepat tampil di beranda */}
              <button
                type="button"
                title="Centang/hilangkan dari cuplikan beranda"
                disabled={busy}
                onClick={() => void handleToggleFeatured(item)}
                className={`rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                  item.featured
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-hairline text-muted hover:border-white/25 hover:text-foreground'
                }`}
              >
                {item.featured ? '★ Di beranda' : '☆ Beranda'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditingId(item.id)}
                className="rounded-md border border-hairline px-3 py-2 text-sm text-foreground transition-colors hover:border-white/25 hover:bg-surface-2 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete(item)}
                className="rounded-md border border-hairline px-3 py-2 text-sm text-muted transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
