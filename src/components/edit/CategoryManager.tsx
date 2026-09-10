import { useState, type FormEvent } from 'react'
import InlineText from './InlineText'
import { GhostBtn, MiniBtn, selectCls } from './controls'
import { useEditMode } from '../../context/EditModeContext'
import {
  addCategory,
  deleteCategory,
  moveProjectsToCategory,
  renameCategory,
  swapPositions,
} from '../../lib/mutations'
import type { Category } from '../../types'

type CategoryManagerProps = {
  categories: Category[]
  /** Jumlah project per kategori (untuk guard saat hapus). */
  usedCounts: Record<number, number>
}

export default function CategoryManager({
  categories,
  usedCounts,
}: CategoryManagerProps) {
  const { toast } = useEditMode()
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  /** Kategori yang sedang dalam alur hapus (karena masih dipakai project). */
  const [deleteFlow, setDeleteFlow] = useState<Category | null>(null)
  const [moveTarget, setMoveTarget] = useState<number | 'none'>('none')

  async function run(action: () => Promise<void>, failMsg: string) {
    setBusy(true)
    try {
      await action()
    } catch (err) {
      toast(
        'error',
        `${failMsg}: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      )
    } finally {
      setBusy(false)
    }
  }

  function askDelete(cat: Category) {
    if ((usedCounts[cat.id] ?? 0) === 0) {
      if (window.confirm(`Hapus kategori "${cat.name}"?`)) {
        void run(() => deleteCategory(cat.id), 'Gagal menghapus kategori')
      }
      return
    }
    // Masih dipakai → tanya: pindahkan dulu atau biarkan tanpa kategori
    setDeleteFlow(cat)
    setMoveTarget('none')
  }

  async function confirmDelete() {
    if (!deleteFlow) return
    const cat = deleteFlow
    await run(async () => {
      await moveProjectsToCategory(
        cat.id,
        moveTarget === 'none' ? null : moveTarget,
      )
      await deleteCategory(cat.id)
    }, 'Gagal menghapus kategori')
    setDeleteFlow(null)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const last = categories[categories.length - 1]
    await run(
      () => addCategory(name, (last?.position ?? 0) + 1),
      'Gagal menambah kategori',
    )
    setNewName('')
  }

  const others = categories.filter((c) => c.id !== deleteFlow?.id)

  return (
    <div className="space-y-3 rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Kelola Kategori
        </p>
        <p className="text-[11px] text-white/25">
          Tab filter project di atas mengikuti daftar ini
        </p>
      </div>

      {/* Daftar kategori */}
      {categories.length === 0 && (
        <p className="text-sm text-white/25">Belum ada kategori.</p>
      )}
      {categories.map((cat, idx) => (
        <div key={cat.id} className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border border-hairline bg-background/50 px-2 py-1.5">
            <div className="flex gap-1">
              <MiniBtn
                title="Naikkan urutan"
                disabled={idx === 0 || busy}
                onClick={() =>
                  void run(
                    () => swapPositions('categories', cat, categories[idx - 1]),
                    'Gagal mengubah urutan',
                  )
                }
              >
                ↑
              </MiniBtn>
              <MiniBtn
                title="Turunkan urutan"
                disabled={idx === categories.length - 1 || busy}
                onClick={() =>
                  void run(
                    () => swapPositions('categories', cat, categories[idx + 1]),
                    'Gagal mengubah urutan',
                  )
                }
              >
                ↓
              </MiniBtn>
            </div>
            <InlineText
              className="min-w-0 flex-1 font-mono text-sm"
              value={cat.name}
              placeholder="Nama kategori…"
              ariaLabel="Edit nama kategori"
              onSave={async (v) => {
                const name = v.trim()
                if (name && name !== cat.name) {
                  await renameCategory(cat.id, name)
                }
              }}
            />
            <span className="font-mono text-[10px] text-white/25">
              {usedCounts[cat.id] ?? 0} project
            </span>
            <MiniBtn
              title="Hapus kategori"
              tone="danger"
              disabled={busy}
              onClick={() => askDelete(cat)}
            >
              ✕
            </MiniBtn>
          </div>

          {/* Alur hapus kategori yang masih dipakai */}
          {deleteFlow?.id === cat.id && (
            <div className="space-y-2 rounded-md border border-red-400/30 bg-red-400/5 p-3">
              <p className="text-xs text-red-300">
                Kategori ini dipakai{' '}
                <strong>{usedCounts[cat.id] ?? 0} project</strong>. Mau
                dipindahkan ke kategori lain, atau dibiarkan tanpa kategori?
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className={`${selectCls} min-w-40`}
                  value={moveTarget}
                  onChange={(e) =>
                    setMoveTarget(
                      e.target.value === 'none' ? 'none' : Number(e.target.value),
                    )
                  }
                >
                  <option value="none">Tanpa kategori</option>
                  {others.map((c) => (
                    <option key={c.id} value={c.id}>
                      Pindah ke: {c.name}
                    </option>
                  ))}
                </select>
                <GhostBtn
                  title="Hapus kategori (project ikut dipindah/tanpa kategori)"
                  tone="danger"
                  disabled={busy}
                  onClick={() => void confirmDelete()}
                >
                  Hapus Kategori
                </GhostBtn>
                <GhostBtn
                  title="Batalkan penghapusan"
                  disabled={busy}
                  onClick={() => setDeleteFlow(null)}
                >
                  Batal
                </GhostBtn>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Tambah kategori */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
        <input
          className="w-full flex-1 rounded-md border border-hairline bg-surface-3 px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-white/45 focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Kategori baru (misal: Web Design)"
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="shrink-0 rounded-md bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Tambah
        </button>
      </form>
    </div>
  )
}
