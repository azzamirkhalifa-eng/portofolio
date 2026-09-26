import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/storage'
import { slugify } from '../../lib/slug'
import { useProjects } from '../../hooks/useProjects'
import { useCategories } from '../../hooks/useCategories'
import {
  ButtonsEditorBilingual,
  GalleryEditor,
  SpecsEditorBilingual,
} from '../edit/DetailEditors'
import CategoryManager from '../edit/CategoryManager'
import { GhostBtn } from '../edit/controls'
import { Field, Feedback, inputCls } from './FormControls'
import type { Category, Project, ProjectButton } from '../../types'

type ProjectData = {
  title: string
  title_en: string
  slug: string
  description: string
  description_en: string
  full_description: string
  full_description_en: string
  tags: string[]
  tags_en: string[]
  image_url: string
  gallery: string[]
  specs: Record<string, string>
  specs_en: Record<string, string>
  buttons: ProjectButton[]
  buttons_en: ProjectButton[]
  cta_label: string
  cta_label_en: string
  cta_url: string
  category_id: number | null
  featured: boolean
  thumbnail_url: string
}

type FeedbackState = { status: 'success' | 'error'; message: string } | null

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
      className="flex h-8 w-8 items-center justify-center rounded border border-hairline text-muted transition-colors hover:border-faint/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function ProjectForm({
  initial,
  categories,
  busy,
  onCancel,
  onSave,
  onFeedback,
}: {
  initial: Project | null
  categories: Category[]
  busy: boolean
  onCancel: () => void
  onSave: (data: ProjectData) => Promise<void>
  onFeedback: (fb: FeedbackState) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? '')
  const [slugText, setSlugText] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [descriptionEn, setDescriptionEn] = useState(
    initial?.description_en ?? '',
  )
  const [fullDescription, setFullDescription] = useState(
    initial?.full_description ?? '',
  )
  const [fullDescriptionEn, setFullDescriptionEn] = useState(
    initial?.full_description_en ?? '',
  )
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '')
  const [tagsEnText, setTagsEnText] = useState(
    (initial?.tags_en ?? []).join(', '),
  )
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? [])
  const [specs, setSpecs] = useState<Record<string, string>>(
    initial?.specs ?? {},
  )
  const [specsEn, setSpecsEn] = useState<Record<string, string>>(
    initial?.specs_en ?? {},
  )
  const [buttons, setButtons] = useState<ProjectButton[]>(
    initial?.buttons ?? [],
  )
  const [buttonsEn, setButtonsEn] = useState<ProjectButton[]>(
    initial?.buttons_en ?? [],
  )
  const [ctaLabel, setCtaLabel] = useState(initial?.cta_label ?? '')
  const [ctaLabelEn, setCtaLabelEn] = useState(initial?.cta_label_en ?? '')
  const [ctaUrl, setCtaUrl] = useState(initial?.cta_url ?? '')
  const [categoryId, setCategoryId] = useState<number | null>(
    initial?.category_id ?? null,
  )
  const [featured, setFeatured] = useState(initial?.featured ?? true)
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? '')
  const [urlUploading, setUrlUploading] = useState(false)
  const [thumbUploading, setThumbUploading] = useState(false)

  const previewSlug = slugText.trim() || slugify(title)

  async function handleImageUpload(file: File | undefined) {
    if (!file) return
    setUrlUploading(true)
    try {
      const url = await uploadImage(file, 'projects')
      setImageUrl(url)
      onFeedback({
        status: 'success',
        message: 'Gambar ter-upload. Klik "Simpan Project" untuk menyimpannya.',
      })
    } catch (err) {
      onFeedback({
        status: 'error',
        message: `Upload gambar gagal: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      })
    } finally {
      setUrlUploading(false)
    }
  }

  async function handleThumbnailUpload(file: File | undefined) {
    if (!file) return
    setThumbUploading(true)
    try {
      const url = await uploadImage(file, 'projects')
      setThumbnailUrl(url)
      onFeedback({
        status: 'success',
        message: 'Thumbnail ter-upload. Klik "Simpan Project" untuk menyimpannya.',
      })
    } catch (err) {
      onFeedback({
        status: 'error',
        message: `Upload thumbnail gagal: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      })
    } finally {
      setThumbUploading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    void onSave({
      title: title.trim(),
      title_en: titleEn.trim(),
      slug: previewSlug,
      description: description.trim(),
      description_en: descriptionEn.trim(),
      full_description: fullDescription,
      full_description_en: fullDescriptionEn,
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      tags_en: tagsEnText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      image_url: imageUrl.trim(),
      gallery,
      specs,
      specs_en: specsEn,
      buttons,
      buttons_en: buttonsEn,
      cta_label: ctaLabel.trim(),
      cta_label_en: ctaLabelEn.trim(),
      cta_url: ctaUrl.trim(),
      category_id: categoryId,
      featured,
      thumbnail_url: thumbnailUrl.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-accent/30 bg-surface p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {initial ? `Edit Project #${initial.id}` : 'Project Baru'}
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
        <Field label="Judul (ID / EN)">
          <div className="grid gap-2">
            <input
              className={`${inputCls} border-accent/30`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ID — nama project"
              required
            />
            <input
              className={inputCls}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="EN — project name (kosong = pakai versi ID)"
            />
          </div>
        </Field>
        <Field label="Tags (pisahkan dengan koma) — ID / EN">
          <div className="grid gap-2">
            <input
              className={`${inputCls} border-accent/30`}
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="ID — React, Vite, Supabase"
            />
            <input
              className={inputCls}
              value={tagsEnText}
              onChange={(e) => setTagsEnText(e.target.value)}
              placeholder="EN — React, Vite, Supabase (kosong = pakai versi ID)"
            />
          </div>
        </Field>
      </div>

      {/* Slug otomatis */}
      <div>
        <Field label="Alamat halaman detail">
          <input
            className={inputCls}
            value={slugText}
            onChange={(e) => setSlugText(e.target.value)}
            placeholder="kosongkan = otomatis dari judul"
          />
        </Field>
        <p className="mt-1 font-mono text-[11px] text-faint/35">
          Halaman: /projects/{previewSlug || '…'}
        </p>
      </div>

      {/* Featured + kategori */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori">
          <select
            className={inputCls}
            value={categoryId ?? ''}
            onChange={(e) =>
              setCategoryId(e.target.value === '' ? null : Number(e.target.value))
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
        <Field label="Tampil di beranda">
          <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-muted">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Muncul di cuplikan halaman utama
          </label>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deskripsi singkat (kartu) — ID / EN">
          <div className="grid gap-2">
            <textarea
              className={`${inputCls} min-h-20 resize-y border-accent/30`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ID — ringkasan yang tampil di kartu project."
            />
            <textarea
              className={`${inputCls} min-h-20 resize-y`}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="EN — card summary (kosong = pakai versi ID)"
            />
          </div>
        </Field>
        <Field label="Deskripsi lengkap (halaman detail) — ID / EN">
          <div className="grid gap-2">
            <textarea
              className={`${inputCls} min-h-20 resize-y border-accent/30`}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="ID — cerita lengkap: latar belakang, fitur, proses…"
            />
            <textarea
              className={`${inputCls} min-h-20 resize-y`}
              value={fullDescriptionEn}
              onChange={(e) => setFullDescriptionEn(e.target.value)}
              placeholder="EN — full story (kosong = pakai versi ID)"
            />
          </div>
        </Field>
      </div>

      {/* Tombol CTA utama */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label tombol CTA (di atas judul) — ID / EN">
          <div className="grid gap-2">
            <input
              className={`${inputCls} border-accent/30`}
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="ID — mis. Lihat Demo"
            />
            <input
              className={inputCls}
              value={ctaLabelEn}
              onChange={(e) => setCtaLabelEn(e.target.value)}
              placeholder="EN — e.g. View Demo (kosong = pakai versi ID)"
            />
          </div>
        </Field>
        <Field label="URL tujuan tombol CTA">
          <input
            className={inputCls}
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://… (kosong = disembunyikan)"
          />
        </Field>
      </div>

      {/* Tombol aksi (dua bahasa) */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Tombol (tampil di atas halaman detail, ID + EN)
        </span>
        <ButtonsEditorBilingual
          buttons={buttons}
          buttonsEn={buttonsEn}
          onChange={({ buttons: b, buttonsEn: be }) => {
            setButtons(b)
            setButtonsEn(be)
          }}
        />
        <p className="mt-1 font-mono text-[11px] text-faint/35">
          Label + URL bebas, bisa lebih dari satu. Tombol pertama tampil
          solid, sisanya garis tepi. URL boleh kosong (opsional).
        </p>
      </div>

      {/* Thumbnail beranda */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Thumbnail Beranda (opsional)
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Thumbnail beranda"
              className="h-16 w-28 rounded-md border border-hairline object-cover"
            />
          ) : (
            <div className="flex h-16 w-28 items-center justify-center rounded-md border border-hairline bg-surface-2 font-mono text-[11px] text-faint/25">
              No Thumbnail
            </div>
          )}
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:border-faint/25 hover:bg-surface-2">
              {thumbUploading ? 'Uploading…' : 'Upload Thumbnail'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={thumbUploading}
                onChange={(e) => void handleThumbnailUpload(e.target.files?.[0])}
              />
            </label>
            <input
              className={`${inputCls} mt-2`}
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="…atau tempel URL thumbnail langsung di sini"
            />
          </div>
        </div>
      </div>

      {/* Gambar preview */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Gambar Preview (kartu)
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview project"
              className="h-20 w-36 rounded-md border border-hairline object-cover"
            />
          ) : (
            <div className="flex h-20 w-36 items-center justify-center rounded-md border border-hairline bg-surface-2 font-mono text-[11px] text-faint/25">
              No Gambar
            </div>
          )}
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:border-faint/25 hover:bg-surface-2">
              {urlUploading ? 'Uploading…' : 'Upload Gambar'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={urlUploading}
                onChange={(e) => void handleImageUpload(e.target.files?.[0])}
              />
            </label>
            <input
              className={`${inputCls} mt-2`}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="…atau tempel URL gambar langsung di sini"
            />
          </div>
        </div>
      </div>

      {/* Galeri */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Galeri Screenshot (halaman detail)
        </span>
        <GalleryEditor
          images={gallery}
          onChange={setGallery}
          folder="projects"
          cropContext="gallery"
          cropTitle="Foto Galeri Project"
        />
      </div>

      {/* Spesifikasi (dua bahasa) */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Spesifikasi (key-value bebas, ID + EN)
        </span>
        <SpecsEditorBilingual
          specs={specs}
          specsEn={specsEn}
          onChange={({ specs: s, specsEn: se }) => {
            setSpecs(s)
            setSpecsEn(se)
          }}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={busy || urlUploading || thumbUploading || !title.trim()}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? 'Menyimpan…' : 'Simpan Project'}
        </button>
      </div>
    </form>
  )
}

export default function ProjectsSection() {
  const { projects, loading } = useProjects()
  const { categories } = useCategories()
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [manageCats, setManageCats] = useState(false)
  /** Urutan daftar: sesuai posisi tampil, atau berdasarkan view terbanyak. */
  const [sortByViews, setSortByViews] = useState(false)

  /** Project dengan view terbanyak (untuk highlight "Terpopuler"). */
  const topViewedId = projects.reduce<number | null>(
    (top, p) => (p.view_count > 0 && (top === null || p.view_count > (projects.find((x) => x.id === top)?.view_count ?? 0)) ? p.id : top),
    null,
  )

  /** Daftar yang ditampilkan — urut posisi atau urut view terbanyak. */
  const displayProjects = sortByViews
    ? [...projects].sort((a, b) => b.view_count - a.view_count)
    : projects

  // Jumlah project per kategori (untuk panel kelola kategori).
  const usedCounts: Record<number, number> = {}
  for (const p of projects) {
    if (p.category_id !== null) {
      usedCounts[p.category_id] = (usedCounts[p.category_id] ?? 0) + 1
    }
  }

  async function handleSave(data: ProjectData, targetId: number | 'new') {
    setBusy(true)
    setFeedback(null)

    /** Simpan; kalau kolom buttons belum ada (migration v4 belum
        dijalankan), simpan ulang tanpa tombol supaya field lain tetap
        bisa disimpan. */
    async function persist(payload: Record<string, unknown>) {
      if (targetId === 'new') {
        const last = projects[projects.length - 1]
        return supabase
          .from('projects')
          .insert({ ...payload, position: (last?.position ?? 0) + 1 })
      }
      return supabase.from('projects').update(payload).eq('id', targetId)
    }

    let result = await persist(data as unknown as Record<string, unknown>)
    if (
      result.error &&
      /buttons.*does not exist|does not exist.*buttons|cta_label|cta_url|specs_en|tags_en|42703|thumbnail_url.*does not exist|does not exist.*thumbnail_url/.test(
        result.error.message,
      )
    ) {
      // Kolom baru (buttons, cta_label, thumbnail_url + versi EN dari
      // migration v16) belum ada karena migration belum dijalankan —
      // simpan ulang tanpa kolom itu supaya field lain tetap bisa disimpan.
      const rest = { ...data } as Record<string, unknown>
      delete rest.buttons
      delete rest.cta_label
      delete rest.cta_url
      delete rest.thumbnail_url
      delete rest.cta_label_en
      delete rest.buttons_en
      delete rest.specs_en
      delete rest.tags_en
      result = await persist(rest)
    }
    const error = result.error

    setBusy(false)
    if (error) {
      setFeedback({
        status: 'error',
        message: `Gagal menyimpan: ${error.message}`,
      })
      return
    }
    setEditingId(null)
    setFeedback({
      status: 'success',
      message:
        targetId === 'new'
          ? 'Project ditambahkan — langsung tampil di halaman publik.'
          : 'Perubahan project disimpan — langsung tampil di halaman publik.',
    })
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Hapus project "${project.title}"?`)) return
    setBusy(true)
    setFeedback(null)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)
    setBusy(false)
    if (error) {
      setFeedback({ status: 'error', message: `Gagal menghapus: ${error.message}` })
    } else {
      setFeedback({ status: 'success', message: `Project "${project.title}" dihapus.` })
    }
  }

  /** Tukar posisi dua project berurutan (↑/↓). */
  async function handleMove(project: Project, dir: -1 | 1) {
    const idx = projects.findIndex((p) => p.id === project.id)
    const target = projects[idx + dir]
    if (!target) return

    setBusy(true)
    setFeedback(null)
    const { error: e1 } = await supabase
      .from('projects')
      .update({ position: target.position })
      .eq('id', project.id)
    const { error: e2 } = await supabase
      .from('projects')
      .update({ position: project.position })
      .eq('id', target.id)

    setBusy(false)
    if (e1 || e2) {
      setFeedback({
        status: 'error',
        message: `Gagal mengubah urutan: ${e1?.message ?? e2?.message}`,
      })
    } else {
      setFeedback({ status: 'success', message: 'Urutan disimpan.' })
    }
  }

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-lg border border-hairline bg-surface" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Projects<span className="text-accent-text">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Kelola project: konten kartu, halaman detail (deskripsi lengkap,
            galeri screenshot, tombol, spesifikasi), kategori, dan pilihan
            tampil di beranda — semua tersimpan ke tabel{' '}
            <code className="font-mono text-accent-text">projects</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSortByViews((v) => !v)}
            title="Urutkan project berdasarkan jumlah view terbanyak"
            className={`rounded-md border px-4 py-2.5 text-sm transition-colors ${
              sortByViews
                ? 'border-accent bg-accent/10 text-accent-text'
                : 'border-hairline text-muted hover:border-faint/25 hover:text-foreground'
            }`}
          >
            {sortByViews ? '★ Urut View' : 'Urut View'}
          </button>
          <GhostBtn
            title="Tambah, hapus, dan urutkan kategori"
            onClick={() => setManageCats((v) => !v)}
          >
            {manageCats ? 'Tutup Kategori' : 'Kelola Kategori'}
          </GhostBtn>
          <button
            type="button"
            onClick={() => setEditingId(editingId === 'new' ? null : 'new')}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {editingId === 'new' ? 'Batal Tambah' : '+ Tambah Project'}
          </button>
        </div>
      </div>

      <Feedback
        status={feedback?.status ?? null}
        message={feedback?.message ?? null}
      />

      {manageCats && (
        <CategoryManager categories={categories} usedCounts={usedCounts} />
      )}

      {editingId === 'new' && (
        <ProjectForm
          initial={null}
          busy={busy}
          onCancel={() => setEditingId(null)}
          onSave={(data) => handleSave(data, 'new')}
          onFeedback={setFeedback}
          categories={categories}
        />
      )}

      <div className="space-y-2">
        {projects.length === 0 && editingId !== 'new' && (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
            Belum ada project. Klik "+ Tambah Project" untuk mulai.
          </p>
        )}

        {displayProjects.map((project, idx) =>
          editingId === project.id ? (
            <ProjectForm
              key={project.id}
              initial={project}
              busy={busy}
              onCancel={() => setEditingId(null)}
              onSave={(data) => handleSave(data, project.id)}
              onFeedback={setFeedback}
              categories={categories}
            />
          ) : (
            <div
              key={project.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface p-3"
            >
              {/* Urutan posisi disembunyikan saat daftar diurutkan per view */}
              {!sortByViews && (
                <div className="flex flex-col gap-1.5">
                  <ArrowButton
                    label="Naikkan urutan"
                    disabled={idx === 0 || busy}
                    onClick={() => void handleMove(project, -1)}
                  >
                    ↑
                  </ArrowButton>
                  <ArrowButton
                    label="Turunkan urutan"
                    disabled={idx === projects.length - 1 || busy}
                    onClick={() => void handleMove(project, 1)}
                  >
                    ↓
                  </ArrowButton>
                </div>
              )}

              {project.thumbnail_url ? (
                <img
                  src={project.thumbnail_url}
                  alt=""
                  className="h-14 w-24 rounded-md border border-hairline object-cover"
                />
              ) : project.image_url ? (
                <img
                  src={project.image_url}
                  alt=""
                  className="h-14 w-24 rounded-md border border-hairline object-cover"
                />
              ) : (
                <div className="flex h-14 w-24 items-center justify-center rounded-md border border-hairline bg-surface-2 font-mono text-[10px] text-faint/25">
                  No Img
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {project.title}
                  {project.id === topViewedId && (
                    <span
                      title="Project dengan view terbanyak"
                      className="ml-2 rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-text"
                    >
                      ★ terpopuler
                    </span>
                  )}
                  {!project.featured && (
                    <span className="ml-2 rounded-sm border border-faint/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-faint/30">
                      tidak di beranda
                    </span>
                  )}
                </p>
                <p className="truncate font-mono text-xs text-muted">
                  pos {project.position} · /projects/{project.slug} ·{' '}
                  {(project.buttons ?? []).length} tombol ·{' '}
                  {(project.gallery ?? []).length} galeri ·{' '}
                  {Object.keys(project.specs ?? {}).length} spesifikasi ·{' '}
                  {project.thumbnail_url ? 'ada thumbnail' : 'tanpa thumbnail'}
                </p>
              </div>

              {/* View counter — internal admin, tidak tampil di halaman publik */}
              <div
                title="Jumlah view halaman detail (internal)"
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 font-mono text-xs text-muted"
              >
                <svg
                  aria-hidden
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {project.view_count ?? 0}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditingId(project.id)}
                  className="rounded-md border border-hairline px-3 py-2 text-sm text-foreground transition-colors hover:border-faint/25 hover:bg-surface-2 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete(project)}
                  className="rounded-md border border-hairline px-3 py-2 text-sm text-muted transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}