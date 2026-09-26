import { useState } from 'react'
import SectionLabel from './ui/SectionLabel'
import ProjectCard from './ProjectCard'
import Button from './ui/Button'
import SectionBox from './ui/SectionBox'
import RandomButton from './ui/RandomButton'
import CategoryManager from './edit/CategoryManager'
import { GhostBtn, selectCls } from './edit/controls'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import { pick, t, ui } from '../lib/i18n'
import {
  addProject,
  deleteProject,
  swapProjects,
  updateProfile,
} from '../lib/mutations'
import type { Category, Profile, Project } from '../types'

type ProjectsProps = {
  profile: Profile | null
  projects: Project[]
  categories: Category[]
  loading: boolean
  /** true = cuplikan di beranda (beberapa project + tombol "Lihat Semua"). */
  preview?: boolean
}

/** Jumlah project yang ditampilkan cuplikan beranda. */
const PREVIEW_COUNT = 3

const gridClsByCols: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
}

export default function Projects({
  profile,
  projects,
  categories,
  loading,
  preview = false,
}: ProjectsProps) {
  const { enabled, toast } = useEditMode()
  const { lang } = useLanguage()
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [manageOpen, setManageOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [newOpenId, setNewOpenId] = useState<number | null>(null)

  // Tab filter = kategori yang benar-benar dipakai project (urutan categories.position)
  const usedIds = new Set(
    projects.map((p) => p.category_id).filter((v): v is number => v !== null),
  )
  const tabs = categories.filter((c) => usedIds.has(c.id))
  const visible =
    filter === 'all'
      ? projects
      : projects.filter((p) => p.category_id === filter)
  /** Di beranda: project yang dipilih admin (featured) saja. */
  const featuredList = projects.filter((p) => p.featured)
  const shown = preview
    // Kalau belum ada yang ditandai featured, tampilkan beberapa teratas
    // supaya section tidak kosong.
    ? featuredList.length > 0
      ? featuredList
      : visible.slice(0, PREVIEW_COUNT)
    : visible

  const columns = Math.min(3, Math.max(1, profile?.projects_columns ?? 2))
  const gridCls = gridClsByCols[columns]

  // Tujuan tombol "Acak": SEMUA project yang punya slug (halaman detail).
  const randomTargets = projects
    .filter((p) => p.slug)
    .map((p) => ({ id: p.id, to: `/projects/${p.slug}` }))

  // Cuplikan beranda: kalau featured sedikit (1–3), kartu dirapikan ke
  // tengah (flex center) supaya tidak ada ruang kosong di kanan;
  // kalau banyak (4+), pakai grid biasa.
  const isCentered = preview && shown.length > 0 && shown.length < 4

  const usedCounts: Record<number, number> = {}
  for (const p of projects) {
    if (p.category_id !== null) {
      usedCounts[p.category_id] = (usedCounts[p.category_id] ?? 0) + 1
    }
  }

  function toastErr(err: unknown, prefix: string) {
    toast(
      'error',
      `${prefix}: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
    )
  }

  async function handleMove(project: Project, dir: -1 | 1) {
    const idx = projects.findIndex((p) => p.id === project.id)
    const target = projects[idx + dir]
    if (!target) return
    setBusy(true)
    try {
      await swapProjects(project, target)
    } catch (err) {
      toastErr(err, 'Gagal mengubah urutan')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Hapus project "${project.title || 'tanpa judul'}"?`)) {
      return
    }
    setBusy(true)
    try {
      await deleteProject(project.id)
      toast('success', 'Project dihapus.')
    } catch (err) {
      toastErr(err, 'Gagal menghapus project')
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd() {
    const last = projects[projects.length - 1]
    setBusy(true)
    try {
      const id = await addProject({
        title: '',
        description: '',
        image_url: '',
        tags: [],
        demo_url: '',
        github_url: '',
        category_id: null,
        position: (last?.position ?? 0) + 1,
      })
      setNewOpenId(id)
      toast('success', 'Project baru dibuat — isi lewat kartunya.')
    } catch (err) {
      toastErr(err, 'Gagal menambah project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionBox id="projects">
      {/* Header + kontrol (edit mode) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel index="03">Projects</SectionLabel>
        {enabled && profile && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              Kolom
              <select
                className={selectCls}
                value={columns}
                onChange={async (e) => {
                  try {
                    await updateProfile({
                      projects_columns: Number(e.target.value),
                    })
                  } catch (err) {
                    toastErr(err, 'Gagal menyimpan jumlah kolom')
                  }
                }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
            <GhostBtn
              title="Kelola daftar kategori"
              onClick={() => setManageOpen((v) => !v)}
            >
              {manageOpen ? 'Tutup Kategori' : 'Kelola Kategori'}
            </GhostBtn>
          </div>
        )}

        {/* Panel kelola kategori */}
        {enabled && manageOpen && (
          <div className="mt-6">
            <CategoryManager categories={categories} usedCounts={usedCounts} />
          </div>
        )}

        {/* Filter kategori + tombol "Acak" (hanya di halaman /projects) */}
        {!preview && !loading && (
          <div className="mt-14 flex flex-wrap items-center justify-between gap-3">
            {tabs.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`shrink-0 rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                    filter === 'all'
                      ? 'border-accent bg-accent text-white'
                      : 'border-hairline text-muted hover:border-faint/25 hover:text-foreground'
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
                          : 'border-hairline text-muted hover:border-faint/25 hover:text-foreground'
                      }`}
                    >
                      {pick(cat.name, cat.name_en, lang)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <span />
            )}
            <RandomButton items={randomTargets} label={ui.acakProject} />
          </div>
        )}

        {/* Grid project */}
        <div
          key={`${filter}-${columns}`}
          className={
            isCentered
              ? 'mt-14 flex flex-wrap justify-center gap-5'
              : `mt-14 grid gap-5 ${gridCls}`
          }
        >
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-lg border border-hairline bg-surface"
                >
                  <div className="aspect-video bg-surface-2" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-2/3 rounded bg-surface-2" />
                    <div className="h-4 w-full rounded bg-surface-2" />
                    <div className="h-4 w-4/5 rounded bg-surface-2" />
                  </div>
                </div>
              )
              )
            : shown.map((project, idx) => {
                const globalIdx = projects.findIndex((p) => p.id === project.id)
                return (
                  <div
                    key={project.id}
                    className={`reveal ${
                      isCentered ? 'w-full sm:w-[calc(50%-0.625rem)]' : ''
                    }`}
                    style={{ animationDelay: `${(idx % 4) * 100}ms` }}
                  >
                    <ProjectCard
                      project={project}
                      categories={categories}
                      canUp={globalIdx > 0}
                      canDown={globalIdx < projects.length - 1}
                      onMove={(dir) => void handleMove(project, dir)}
                      onDelete={() => void handleDelete(project)}
                      initiallyOpenDetail={newOpenId === project.id}
                    />
                  </div>
                )
              })
          }
        </div>

        {/* Tombol "Lihat Semua Project" (hanya di cuplikan beranda) */}
        {preview && !loading && projects.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button to="/projects" variant="ghost">
              {t(ui.lihatSemuaProject, lang)} <span aria-hidden>→</span>
            </Button>
            <RandomButton items={randomTargets} label={ui.acakProject} />
          </div>
        )}

        {/* Tombol tambah project (edit mode) — hanya di halaman /projects,
            supaya project baru tidak tersembunyi dari cuplikan beranda */}
        {enabled && !preview && (
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-faint/15 px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:border-accent/50 hover:text-accent-text disabled:opacity-50"
          >
            {busy ? 'Menambahkan…' : '+ Tambah Project'}
          </button>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <p className="mt-10 rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
            Belum ada project.{' '}
            {enabled
              ? preview
                ? 'Buka halaman "Lihat Semua Project" untuk menambahkan project pertama.'
                : 'Klik "+ Tambah Project" di atas untuk membuat project pertama.'
              : 'Admin bisa menambahkan lewat Mode Edit di pojok kanan bawah.'}
          </p>
        )}
      </div>
    </SectionBox>
  )
}