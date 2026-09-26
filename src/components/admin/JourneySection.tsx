import { useEffect, useState, type FormEvent } from 'react'
import { useJourneyEntries, useJourneyCategories } from '../../hooks/useJourneyEntries'
import { formatEntryDate } from '../../lib/i18n'
import { slugify } from '../../lib/slug'
import {
  addJourneyCategory,
  deleteJourneyEntry,
  updateJourneyEntry,
  upsertJourneyEntry,
} from '../../lib/mutations'
import { uploadImage } from '../../lib/storage'
import JourneyCategoryManager from '../edit/JourneyCategoryManager'
import { GalleryEditor } from '../edit/DetailEditors'
import { Field, Feedback, inputCls } from './FormControls'
import type { JourneyEntry } from '../../types'

type FeedbackState = { status: 'success' | 'error'; message: string } | null

/** State form cerita perjalanan (semua field yang bisa diedit admin). */
type JourneyFormState = {
  title: string
  /** Versi English (Fitur bahasa) — kosong = fallback tampil versi ID. */
  title_en: string
  entry_date: string
  category_id: number | null
  excerpt: string
  excerpt_en: string
  full_story: string
  full_story_en: string
  /** Foto utama — hero besar di atas detail + thumbnail timeline. */
  hero_image: string
  gallery_images: string[]
  slug: string
}

function toFormState(entry: JourneyEntry | null): JourneyFormState {
  return {
    title: entry?.title ?? '',
    title_en: entry?.title_en ?? '',
    entry_date: (entry?.entry_date ?? '').slice(0, 10),
    category_id: entry?.category_id ?? null,
    excerpt: entry?.excerpt ?? '',
    excerpt_en: entry?.excerpt_en ?? '',
    full_story: entry?.full_story ?? '',
    full_story_en: entry?.full_story_en ?? '',
    hero_image: entry?.hero_image ?? '',
    gallery_images: entry?.gallery_images ?? [],
    slug: entry?.slug ?? '',
  }
}

/** Opsi spesial dropdown kategori: membuka input "tambah kategori baru". */
const NEW_CATEGORY = '__new__'

/**
 * Form tambah/edit cerita perjalanan: tanggal (dengan preview format
 * Indonesia), kategori (dropdown + tambah baru langsung), judul,
 * cuplikan, cerita lengkap, FOTO UTAMA (terpisah — pola "Gambar Preview"
 * vs "Galeri" di form project), dan galeri foto (Supabase Storage).
 * Urutan timeline TIDAK diatur di sini — otomatis mengikuti tanggal.
 */
function JourneyForm({
  initial,
  categories,
  busy,
  onCancel,
  onSave,
  onFeedback,
  onCategoryAdded,
}: {
  initial: JourneyEntry | null
  categories: ReturnType<typeof useJourneyCategories>['categories']
  busy: boolean
  onCancel: () => void
  onSave: (fields: JourneyFormState, targetId: number | 'new') => Promise<void>
  onFeedback: (fb: FeedbackState) => void
  onCategoryAdded: (id: number) => void
}) {
  const [state, setState] = useState<JourneyFormState>(() =>
    toFormState(initial),
  )
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatNameEn, setNewCatNameEn] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)

  /** Upload foto utama (hero) — pola sama dengan "Gambar Preview" di
   *  form project: upload tunggal atau tempel URL. */
  async function handleHeroUpload(file: File | undefined) {
    if (!file) return
    setHeroUploading(true)
    try {
      const url = await uploadImage(file, 'journey')
      set('hero_image', url)
      onFeedback({
        status: 'success',
        message:
          'Foto utama ter-upload. Klik "Simpan Cerita" untuk menyimpannya.',
      })
    } catch (err) {
      onFeedback({
        status: 'error',
        message: `Upload foto utama gagal: ${
          err instanceof Error ? err.message : 'terjadi kesalahan.'
        }`,
      })
    } finally {
      setHeroUploading(false)
    }
  }

  function set<K extends keyof JourneyFormState>(key: K, value: JourneyFormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  /** Tambah kategori baru langsung dari form → langsung terpilih. */
  async function handleAddCategory() {
    const name = newCatName.trim()
    if (!name) return
    setAddingCat(true)
    try {
      const last = categories[categories.length - 1]
      const id = await addJourneyCategory(
        name,
        newCatNameEn.trim(),
        (last?.position ?? 0) + 1,
      )
      onCategoryAdded(id)
      set('category_id', id)
      setShowNewCat(false)
      setNewCatName('')
      setNewCatNameEn('')
      onFeedback({ status: 'success', message: `Kategori "${name}" ditambahkan.` })
    } catch (err) {
      onFeedback({
        status: 'error',
        message: `Gagal menambah kategori: ${
          err instanceof Error ? err.message : 'terjadi kesalahan.'
        }`,
      })
    } finally {
      setAddingCat(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!state.title.trim() || !state.entry_date) return
    void onSave(
      {
        ...state,
        title: state.title.trim(),
        excerpt: state.excerpt.trim(),
        slug: state.slug.trim(),
      },
      initial?.id ?? 'new',
    )
  }

  const slugPreview =
    state.slug.trim() || slugify(state.title) || 'otomatis-dari-judul'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-accent/30 bg-surface p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {initial ? `Edit Cerita #${initial.id}` : 'Cerita Baru'}
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
        <Field label="Tanggal kejadian (menentukan urutan timeline)">
          <input
            type="date"
            className={`${inputCls} border-accent/30`}
            value={state.entry_date}
            onChange={(e) => set('entry_date', e.target.value)}
            required
          />
          {state.entry_date && (
            <p className="mt-1.5 font-mono text-[11px] text-accent-text">
              Preview: {formatEntryDate(state.entry_date, 'id')}
            </p>
          )}
        </Field>
        <Field label="Kategori">
          <div className="grid gap-2">
            <select
              className={inputCls}
              value={
                state.category_id === null
                  ? ''
                  : showNewCat
                    ? NEW_CATEGORY
                    : String(state.category_id)
              }
              onChange={(e) => {
                const val = e.target.value
                if (val === NEW_CATEGORY) {
                  setShowNewCat(true)
                  return
                }
                setShowNewCat(false)
                set('category_id', val === '' ? null : Number(val))
              }}
            >
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ Kategori baru…</option>
            </select>
            {showNewCat && (
              <div className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Kategori baru (ID)…"
                  autoFocus
                />
                <input
                  className={inputCls}
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="Category name (EN), opsional…"
                />
                <button
                  type="button"
                  disabled={addingCat || !newCatName.trim()}
                  onClick={() => void handleAddCategory()}
                  className="shrink-0 rounded-md bg-accent px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {addingCat ? 'Menambah…' : 'Tambah'}
                </button>
              </div>
            )}
          </div>
        </Field>
      </div>

      <Field label="Judul cerita — ID / EN">
        <div className="grid gap-2">
          <input
            className={`${inputCls} border-accent/30`}
            value={state.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="ID — misal: Memulai Perjalanan di Dunia Kode"
            required
          />
          <input
            className={inputCls}
            value={state.title_en}
            onChange={(e) => set('title_en', e.target.value)}
            placeholder="EN — kosong = pakai versi Indonesia"
          />
        </div>
      </Field>

      <Field label="Cuplikan singkat (tampil di timeline, 1–2 kalimat) — ID / EN">
        <div className="grid gap-2">
          <textarea
            className={`${inputCls} min-h-16 resize-y border-accent/30`}
            value={state.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="ID — ringkasan singkat cerita ini…"
          />
          <textarea
            className={`${inputCls} min-h-16 resize-y`}
            value={state.excerpt_en}
            onChange={(e) => set('excerpt_en', e.target.value)}
            placeholder="EN — kosong = pakai versi Indonesia"
          />
        </div>
      </Field>

      <Field label="Cerita lengkap (halaman detail — boleh panjang) — ID / EN">
        <div className="grid gap-2">
          <textarea
            className={`${inputCls} min-h-32 resize-y border-accent/30`}
            value={state.full_story}
            onChange={(e) => set('full_story', e.target.value)}
            placeholder="ID — cerita penuh: latar, proses, tantangan, hasil…"
          />
          <textarea
            className={`${inputCls} min-h-32 resize-y`}
            value={state.full_story_en}
            onChange={(e) => set('full_story_en', e.target.value)}
            placeholder="EN — kosong = pakai versi Indonesia"
          />
        </div>
      </Field>

      {/* ── Foto UTAMA (hero) — terpisah dari galeri, pola "Gambar
          Preview" di form project: tampil BESAR di atas halaman detail
          + jadi thumbnail kartu di timeline. Upload tunggal / URL. */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Foto Utama (opsional — tampil besar di atas halaman detail &amp;
          jadi thumbnail timeline)
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {state.hero_image ? (
            <img
              src={state.hero_image}
              alt="Foto utama cerita"
              className="h-20 w-36 rounded-md border border-hairline object-cover"
            />
          ) : (
            <div className="flex h-20 w-36 items-center justify-center rounded-md border border-hairline bg-surface-2 font-mono text-[11px] text-faint/25">
              No Foto
            </div>
          )}
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:border-faint/25 hover:bg-surface-2">
              {heroUploading ? 'Uploading…' : 'Upload Foto Utama'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={heroUploading}
                onChange={(e) => void handleHeroUpload(e.target.files?.[0])}
              />
            </label>
            <input
              className={`${inputCls} mt-2`}
              value={state.hero_image}
              onChange={(e) => set('hero_image', e.target.value)}
              placeholder="…atau tempel URL foto utama langsung di sini"
            />
          </div>
        </div>
      </div>

      {/* ── Galeri foto — TERPISAH dari foto utama (pola "Galeri
          Screenshot" di form project): foto-foto tambahan di bawah
          cerita di halaman detail. Boleh kosong / 1 / banyak. */}
      <div>
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Galeri Foto (opsional — foto-foto tambahan di bawah cerita;
          bukan foto utama di atas)
        </span>
        <GalleryEditor
          images={state.gallery_images}
          onChange={(next) => set('gallery_images', next)}
          folder="journey"
          cropContext="gallery"
          cropTitle="Foto Galeri Perjalanan"
        />
      </div>

      <Field label="Alamat halaman detail">
        <input
          className={inputCls}
          value={state.slug}
          onChange={(e) => set('slug', e.target.value)}
          placeholder="kosongkan = otomatis dari judul"
        />
      </Field>
      <p className="font-mono text-[11px] text-faint/35">
        Halaman: /perjalanan/{slugPreview}
      </p>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={busy || !state.title.trim() || !state.entry_date}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? 'Menyimpan…' : 'Simpan Cerita'}
        </button>
        <span className="font-mono text-[11px] text-faint/30">
          Urutan timeline otomatis mengikuti tanggal — tidak perlu diatur manual
        </span>
      </div>
    </form>
  )
}

/**
 * Tab dashboard "Perjalanan": kelola cerita timeline (tambah/edit/hapus),
 * kelola kategori, dan cek apakah migration-v18.sql sudah dijalankan.
 */
export default function JourneySection() {
  const { entries, loading } = useJourneyEntries(false)
  const { categories, exists } = useJourneyCategories({ allowDummy: false })
  /** null = tutup form; 'new' = tambah; angka = edit id tersebut. */
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [manageCats, setManageCats] = useState(false)
  /** id entry yang galerinya dibuka cepat dari daftar (tanpa buka form
   *  edit penuh — tambah/hapus foto langsung tersimpan per aksi). */
  const [galleryId, setGalleryId] = useState<number | null>(null)
  /** null = masih mengecek; false = migration v18 belum dijalankan. */
  const [tablesReady, setTablesReady] = useState<boolean | null>(null)

  const catName = new Map(categories.map((c) => [c.id, c.name]))

  // Cek sekali: tabel journey sudah ada di DB?
  useEffect(() => {
    let active = true
    void exists().then((ok) => {
      if (active) setTablesReady(ok)
    })
    return () => {
      active = false
    }
  }, [exists])

  async function handleSave(fields: JourneyFormState, targetId: number | 'new') {
    setBusy(true)
    setFeedback(null)
    try {
      await upsertJourneyEntry({
        id: targetId === 'new' ? undefined : targetId,
        title: fields.title,
        title_en: fields.title_en.trim(),
        entry_date: fields.entry_date,
        category_id: fields.category_id,
        excerpt: fields.excerpt,
        excerpt_en: fields.excerpt_en.trim(),
        full_story: fields.full_story,
        full_story_en: fields.full_story_en.trim(),
        hero_image: fields.hero_image.trim(),
        gallery_images: fields.gallery_images,
        slug: fields.slug || undefined,
      })
      setEditingId(null)
      setFeedback({
        status: 'success',
        message:
          targetId === 'new'
            ? 'Cerita ditambahkan — langsung tampil di timeline Perjalanan.'
            : 'Perubahan disimpan — langsung tampil di timeline Perjalanan.',
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

  async function handleDelete(item: JourneyEntry) {
    if (!window.confirm(`Hapus cerita "${item.title || 'tanpa judul'}"?`)) return
    setBusy(true)
    setFeedback(null)
    try {
      await deleteJourneyEntry(item.id)
      if (galleryId === item.id) setGalleryId(null)
      setFeedback({ status: 'success', message: 'Cerita dihapus.' })
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

  if (loading || tablesReady === null) {
    return (
      <div className="h-48 animate-pulse rounded-lg border border-hairline bg-surface" />
    )
  }

  if (!tablesReady) {
    return (
      <div className="space-y-4 rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-6">
        <h1 className="text-xl font-bold tracking-tight">
          Perjalanan<span className="text-accent-text">.</span>
        </h1>
        <p className="text-sm text-muted">
          Tabel <code className="font-mono text-accent-text">journey_entries</code>{' '}
          belum ada di Supabase. Jalankan{' '}
          <code className="font-mono text-accent-text">supabase/migration-v18.sql</code>{' '}
          di Supabase SQL Editor terlebih dahulu, lalu muat ulang halaman ini.
        </p>
      </div>
    )
  }

  const editing = entries.find((e) => e.id === editingId) ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Perjalanan<span className="text-accent-text">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Kelola cerita timeline /perjalanan. Urutan tampil otomatis dari
            tanggal (paling lama di atas → paling baru di bawah). Entry
            terakhir otomatis dapat badge &quot;Kamu di sini sekarang&quot;.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setManageCats((v) => !v)}
            className="rounded-md border border-hairline px-3 py-2 text-sm text-foreground transition-colors hover:border-faint/25 hover:bg-surface-2"
          >
            {manageCats ? 'Tutup Kategori' : 'Kelola Kategori'}
          </button>
          <button
            type="button"
            onClick={() => setEditingId(editingId === 'new' ? null : 'new')}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {editingId === 'new' ? 'Batal Tambah' : '+ Tambah Cerita'}
          </button>
        </div>
      </div>

      <Feedback status={feedback?.status ?? null} message={feedback?.message ?? null} />

      {manageCats && (
        <JourneyCategoryManager
          categories={categories}
          onFeedback={setFeedback}
        />
      )}

      {editingId !== null && (
        <JourneyForm
          key={editingId === 'new' ? 'new' : (editing?.id ?? 'missing')}
          initial={editing}
          categories={categories}
          busy={busy}
          onCancel={() => setEditingId(null)}
          onSave={handleSave}
          onFeedback={setFeedback}
          onCategoryAdded={() => {
            /* daftar kategori ter-refresh otomatis via realtime */
          }}
        />
      )}

      {/* Daftar cerita — urut kronologis (sesuai data dari hook) */}
      <div className="space-y-2">
        {entries.length === 0 && editingId === null && (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
            Belum ada cerita. Klik &quot;+ Tambah Cerita&quot; untuk mengisi
            timeline pertama.
          </p>
        )}

        {entries.map((item, idx) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface p-3"
          >
            {/* Nomor urut kronologis (informatif — bukan kolom position) */}
            <span className="w-8 shrink-0 text-center font-mono text-xs text-faint/25">
              {idx + 1}
            </span>

            {/* Thumbnail = FOTO UTAMA (fallback data lama: foto galeri
                pertama) — sama seperti yang tampil di timeline publik */}
            {item.hero_image || item.gallery_images?.[0] ? (
              <img
                src={item.hero_image || item.gallery_images[0]}
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
                {item.title || '(tanpa judul)'}
                {idx === entries.length - 1 && (
                  <span className="ml-2 rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-text">
                    terbaru
                  </span>
                )}
              </p>
              <p className="truncate font-mono text-xs text-muted">
                {formatEntryDate(item.entry_date, 'id')} ·{' '}
                {item.category_id ? catName.get(item.category_id) ?? '?' : 'tanpa kategori'}{' '}
                · {(item.gallery_images ?? []).length} foto galeri · /perjalanan/{item.slug ?? '…'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setGalleryId(null)
                  setEditingId(item.id)
                }}
                className="rounded-md border border-hairline px-3 py-2 text-sm text-foreground transition-colors hover:border-faint/25 hover:bg-surface-2 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditingId(null)
                  setGalleryId((cur) => (cur === item.id ? null : item.id))
                }}
                aria-expanded={galleryId === item.id}
                className={`rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                  galleryId === item.id
                    ? 'border-accent/50 bg-accent/10 text-accent-text'
                    : 'border-hairline text-foreground hover:border-faint/25 hover:bg-surface-2'
                }`}
              >
                Galeri ({(item.gallery_images ?? []).length})
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

            {/* Editor galeri cepat — buka/tutup dari tombol "Galeri".
                Hanya foto-foto GALERI (bukan foto utama) — tiap aksi
                langsung disimpan tanpa perlu "Simpan". */}
            {galleryId === item.id && (
              <div className="w-full rounded-md border border-hairline bg-surface-2/40 p-3">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                  Foto galeri (di bawah cerita) — langsung tersimpan per
                  aksi. Foto utama diatur di tombol Edit.
                </p>
                <GalleryEditor
                  images={item.gallery_images ?? []}
                  folder="journey"
                  cropContext="gallery"
                  cropTitle="Foto Galeri Perjalanan"
                  onChange={async (next) => {
                    try {
                      await updateJourneyEntry(item.id, {
                        gallery_images: next,
                      })
                      setFeedback({
                        status: 'success',
                        message: 'Galeri disimpan.',
                      })
                    } catch (err) {
                      setFeedback({
                        status: 'error',
                        message: `Gagal menyimpan galeri: ${
                          err instanceof Error
                            ? err.message
                            : 'terjadi kesalahan.'
                        }`,
                      })
                    }
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
