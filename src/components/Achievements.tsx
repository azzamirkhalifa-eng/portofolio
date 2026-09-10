import { useState } from 'react'
import { Link } from 'react-router-dom'
import SectionLabel from './ui/SectionLabel'
import SectionBox from './ui/SectionBox'
import Button from './ui/Button'
import InlineImage from './edit/InlineImage'
import { MiniBtn, selectCls } from './edit/controls'
import AchievementCategoryManager from './edit/AchievementCategoryManager'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import InlineTextBilingual from './edit/InlineTextBilingual'
import { pick, t, ui } from '../lib/i18n'
import {
  addAchievement,
  deleteAchievement,
  swapAchievements,
  updateAchievement,
} from '../lib/mutations'
import { useAchievementCategories } from '../hooks/useAchievementCategories'
import { slugify } from '../lib/slug'
import type { Achievement, AchievementCategory } from '../types'

type AchievementsProps = {
  achievements: Achievement[]
  loading: boolean
  /**
   * true = cuplikan beranda: hanya yang ditandai featured + tombol
   * "Lihat Semua Pencapaian". false = halaman /achievements (lengkap).
   */
  preview?: boolean
}

function toastErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'terjadi kesalahan.'
}

/** Jumlah pencapaian yang ditampilkan cuplikan beranda (fallback). */
const PREVIEW_COUNT = 3

/**
 * Satu kartu sertifikat.
 * - Pengunjung: seluruh kartu jadi link ke halaman detail.
 * - Mode Edit: teks inline, upload gambar, kategori, urutan, hapus —
 *   link dimatikan supaya klik tidak "lari" saat sedang mengedit.
 */
function AchievementCard({
  item,
  first,
  last,
  busy,
  categories,
  onMove,
  onDelete,
}: {
  item: Achievement
  first: boolean
  last: boolean
  busy: boolean
  categories: AchievementCategory[]
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  const { enabled, toast } = useEditMode()
  const { lang } = useLanguage()

  async function save(patch: Partial<Achievement>) {
    try {
      await updateAchievement(item.id, patch)
    } catch (err) {
      toast('error', `Gagal menyimpan: ${toastErrMsg(err)}`)
    }
  }

  const catName = categories.find((c) => c.id === item.category_id)?.name
  const meta = [catName, pick(item.issuer, item.issuer_en, lang), item.year]
    .filter(Boolean)
    .join(' · ')
  const detailTo =
    !enabled && item.slug ? `/achievements/${item.slug}` : null
  /** Slug belum ada → dibuat otomatis dari judul saat judul disimpan. */
  const slugAuto = !item.slug

  const body = (
    <>
      {/* Gambar sertifikat (opsional) */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-hairline bg-surface-2">
        <InlineImage
          src={item.image_url}
          alt={`Sertifikat ${item.title || 'tanpa judul'}`}
          folder="achievements"
          uploadLabel="Ganti Sertifikat"
          shapeClass="rounded-none"
          onSave={async (url) => {
            await save({ image_url: url })
          }}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={`Sertifikat ${pick(item.title, item.title_en, lang)}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-[0.3em] text-white/15">
              <span aria-hidden className="text-2xl">🏅</span>
              No Gambar
              {enabled && (
                <span className="text-[10px] normal-case tracking-normal text-accent">
                  klik untuk upload
                </span>
              )}
            </div>
          )}
        </InlineImage>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent">
          <InlineTextBilingual
            valueId={item.title}
            valueEn={item.title_en ?? ''}
            enabled={enabled}
            ariaLabel="Edit judul sertifikat"
            placeholder="Nama sertifikat/pencapaian…"
            placeholderEn="Certificate/achievement name…"
            onSaveId={async (v) => {
              const title = v.trim()
              const patch: Partial<Achievement> = { title }
              if (slugAuto && title) {
                patch.slug = slugify(title) || item.slug
              }
              await save(patch)
            }}
            onSaveEn={async (v) => {
              await save({ title_en: v.trim() })
            }}
          />
        </h3>

        {meta && <p className="mt-2 font-mono text-xs text-accent">{meta}</p>}

        {pick(item.description, item.description_en, lang) && (
          <p className="project-card-text mt-2 line-clamp-3 leading-relaxed text-muted">
            {pick(item.description, item.description_en, lang)}
          </p>
        )}

        {detailTo && (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-accent transition-colors group-hover:text-accent-hover">
            {t(ui.lihatDetail, lang)}
            <span aria-hidden>→</span>
          </span>
        )}

        {/* Mode Edit: deskripsi, kategori, urutan, hapus */}
        {enabled && (
          <div className="mt-3 space-y-2 border-t border-hairline pt-3">
            <InlineTextBilingual
              valueId={item.description}
              valueEn={item.description_en ?? ''}
              enabled={enabled}
              multiline
              placeholder="Deskripsi singkat (opsional)…"
              placeholderEn="Short description (optional)…"
              ariaLabel="Edit deskripsi sertifikat"
              onSaveId={async (v) => {
                await save({ description: v })
              }}
              onSaveEn={async (v) => {
                await save({ description_en: v })
              }}
            />
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                Kategori
              </span>
              <select
                className={`${selectCls} mt-1 w-full`}
                value={item.category_id ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  void save({ category_id: val === '' ? null : Number(val) })
                }}
              >
                <option value="">— Tanpa kategori —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <MiniBtn
                title="Edit penyelenggara & tahun (ID + EN)"
                disabled={busy}
                onClick={() => {
                  const issuer = window.prompt(
                    'Penyelenggara (Indonesia):',
                    item.issuer,
                  )
                  if (issuer === null) return
                  const issuerEn = window.prompt(
                    'Penyelenggara (English) — kosong = pakai versi Indonesia:',
                    item.issuer_en ?? '',
                  )
                  if (issuerEn === null) return
                  const year = window.prompt('Tahun:', item.year)
                  if (year === null) return
                  void save({
                    issuer: issuer.trim(),
                    issuer_en: issuerEn.trim(),
                    year: year.trim(),
                  })
                }}
              >
                ✎
              </MiniBtn>
              <div className="flex gap-1">
                <MiniBtn
                  title="Naikkan urutan"
                  disabled={first || busy}
                  onClick={() => onMove(-1)}
                >
                  ↑
                </MiniBtn>
                <MiniBtn
                  title="Turunkan urutan"
                  disabled={last || busy}
                  onClick={() => onMove(1)}
                >
                  ↓
                </MiniBtn>
              </div>
              <MiniBtn
                title="Hapus sertifikat"
                tone="danger"
                disabled={busy}
                onClick={onDelete}
              >
                ✕
              </MiniBtn>
            </div>
            <p className="font-mono text-[10px] text-white/25">
              Penyelenggara: {item.issuer || '(kosong)'}
              {(item.issuer_en ?? '').trim() !== '' && ` / EN: ${item.issuer_en}`} · Tahun:{' '}
              {item.year || '(kosong)'}
            </p>
          </div>
        )}
      </div>
    </>
  )

  return (
    <article className="reveal group flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface transition-colors hover:border-white/20">
      {detailTo ? (
        <Link
          to={detailTo}
          data-edit-nav
          className="flex flex-1 flex-col"
          aria-label={`Lihat detail pencapaian ${item.title}`}
        >
          {body}
        </Link>
      ) : (
        <div className="flex flex-1 flex-col">{body}</div>
      )}
    </article>
  )
}

/**
 * Section "Sertifikat & Pencapaian".
 * - Beranda (preview): hanya featured + tombol "Lihat Semua Pencapaian".
 * - Halaman /achievements: semua pencapaian + filter kategori.
 */
export default function Achievements({
  achievements,
  loading,
  preview = false,
}: AchievementsProps) {
  const { enabled, toast } = useEditMode()
  const { lang } = useLanguage()
  const { categories } = useAchievementCategories()
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [manageOpen, setManageOpen] = useState(false)

  // Tab filter = kategori yang benar-benar dipakai (urutan position).
  const usedIds = new Set(
    achievements
      .map((a) => a.category_id)
      .filter((v): v is number => v !== null),
  )
  const tabs = categories.filter((c) => usedIds.has(c.id))
  const filtered =
    filter === 'all'
      ? achievements
      : achievements.filter((a) => a.category_id === filter)

  // Beranda: yang ditandai featured; kalau belum ada satupun yang
  // ditandai, tampilkan beberapa teratas supaya section tidak kosong.
  const featuredList = achievements.filter((a) => a.featured)
  const shown = preview
    ? featuredList.length > 0
      ? featuredList
      : achievements.slice(0, PREVIEW_COUNT)
    : filtered

  const showFilter = !preview && !loading && tabs.length > 0

  async function run(action: () => Promise<void>, failMsg: string) {
    setBusy(true)
    try {
      await action()
    } catch (err) {
      toast('error', `${failMsg}: ${toastErrMsg(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleMove(item: Achievement, dir: -1 | 1) {
    const idx = achievements.findIndex((a) => a.id === item.id)
    const target = achievements[idx + dir]
    if (!target) return
    await run(() => swapAchievements(item, target), 'Gagal mengubah urutan')
  }

  async function handleDelete(item: Achievement) {
    if (!window.confirm(`Hapus "${item.title || 'sertifikat tanpa judul'}"?`)) return
    await run(() => deleteAchievement(item.id), 'Gagal menghapus sertifikat')
  }

  async function handleAdd() {
    const last = achievements[achievements.length - 1]
    await run(async () => {
      await addAchievement((last?.position ?? 0) + 1)
    }, 'Gagal menambah sertifikat')
  }

  return (
    <SectionBox id="achievements">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel index="02">{t(ui.sertifikatPencapaian, lang)}</SectionLabel>
        {enabled && (
          <div className="flex items-center gap-2">
            <MiniBtn
              title="Kelola kategori pencapaian"
              disabled={busy}
              onClick={() => setManageOpen((v) => !v)}
            >
              {manageOpen ? 'Tutup Kategori' : 'Kategori'}
            </MiniBtn>
            {!preview && (
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={busy}
                className="rounded-md border border-dashed border-white/15 px-3.5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
              >
                + Tambah
              </button>
            )}
          </div>
        )}
      </div>

      {/* Panel kelola kategori (Mode Edit) */}
      {enabled && manageOpen && (
        <div className="mt-6">
          <AchievementCategoryManager categories={categories} />
        </div>
      )}

      {/* Tab filter kategori — hanya di halaman /achievements */}
      {showFilter && (
        <div className="mt-14 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
              filter === 'all'
                ? 'border-accent bg-accent text-white'
                : 'border-hairline text-muted hover:border-white/25 hover:text-foreground'
            }`}
          >
            {t(ui.semua, lang)}
          </button>
          {tabs.map((cat) => {
            const active = filter === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(active ? 'all' : cat.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-hairline text-muted hover:border-white/25 hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-lg border border-hairline bg-surface"
            >
              <div className="aspect-[4/3] bg-surface-2" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 rounded bg-surface-2" />
                <div className="h-3 w-1/3 rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-14 rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
          {achievements.length === 0
            ? 'Belum ada sertifikat/pencapaian.'
            : preview
              ? 'Semua pencapaian disembunyikan dari beranda — lihat di halaman Pencapaian.'
              : 'Tidak ada sertifikat di kategori ini.'}{' '}
          {enabled &&
            (preview
              ? 'Kelola lewat dashboard (tab Pencapaian) atau halaman Pencapaian.'
              : 'Klik "+ Tambah" untuk membuat entri pertama.')}
        </p>
      ) : (
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item, idx) => (
            <AchievementCard
              key={item.id}
              item={item}
              first={idx === 0}
              last={idx === shown.length - 1}
              busy={busy}
              categories={categories}
              onMove={(dir) => void handleMove(item, dir)}
              onDelete={() => void handleDelete(item)}
            />
          ))}
        </div>
      )}

      {/* Tombol "Lihat Semua Pencapaian" — hanya di cuplikan beranda */}
      {preview && !loading && achievements.length > 0 && (
        <div className="mt-10 flex justify-center">
          <Button to="/achievements" variant="ghost">
            {t(ui.lihatSemuaPencapaian, lang)} <span aria-hidden>→</span>
          </Button>
        </div>
      )}
    </SectionBox>
  )
}
