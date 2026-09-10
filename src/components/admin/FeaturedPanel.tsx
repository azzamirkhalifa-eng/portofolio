import { useProjects } from '../../hooks/useProjects'
import { updateProject } from '../../lib/mutations'
import type { Project } from '../../types'

/**
 * Panel "Tampil di Beranda" (dashboard admin): daftar centang semua
 * project di satu tempat — centang = muncul di cuplikan beranda.
 * Sama persis dengan switch "Tampil di beranda" di kartu project
 * (kolom featured), hanya ditata ringkas di satu halaman.
 */
export default function FeaturedPanel() {
  const { projects, loading } = useProjects()

  async function toggle(project: Project) {
    await updateProject(project.id, { featured: !project.featured })
  }

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-lg border border-hairline bg-surface" />
    )
  }

  const featuredCount = projects.filter((p) => p.featured).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Tampil di Beranda<span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Centang project yang ingin tampil di cuplikan beranda.{' '}
          {featuredCount > 0
            ? `${featuredCount} project tercentang.`
            : 'Belum ada yang tercentang — beranda akan menampilkan beberapa project teratas otomatis.'}
        </p>
      </div>

      <div className="space-y-2">
        {projects.length === 0 && (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
            Belum ada project. Tambahkan lewat tab Projects.
          </p>
        )}
        {projects.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-surface p-3 transition-colors hover:border-white/25"
          >
            <input
              type="checkbox"
              checked={p.featured}
              onChange={() => void toggle(p).catch(() => {})}
              className="h-4 w-4 accent-accent"
            />
            {p.image_url || p.thumbnail_url ? (
              <img
                src={p.thumbnail_url || p.image_url}
                alt=""
                className="h-10 w-16 rounded border border-hairline object-cover"
              />
            ) : (
              <div className="h-10 w-16 shrink-0 rounded border border-hairline bg-surface-2" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {p.title || 'Tanpa judul'}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              #{p.position}
            </span>
          </label>
        ))}
      </div>

      <p className="text-xs text-white/25">
        Perubahan langsung tersimpan & tampil realtime di halaman publik.
      </p>
    </div>
  )
}
