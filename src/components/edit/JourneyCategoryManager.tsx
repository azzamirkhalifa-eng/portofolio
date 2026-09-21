import { useState } from 'react'
import InlineText from './InlineText'
import { MiniBtn } from './controls'
import {
  addJourneyCategory,
  deleteJourneyCategory,
  renameJourneyCategory,
  swapJourneyCategories,
} from '../../lib/mutations'
import type { JourneyCategory } from '../../types'

function toastErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'terjadi kesalahan.'
}

/**
 * Panel kelola kategori perjalanan — dipakai di dashboard admin
 * (tab Perjalanan). Tambah / rename inline / urutkan ↑↓ / hapus.
 * Hapus kategori membuat cerita yang memakainya menjadi tanpa
 * kategori (FK on delete set null — datanya tetap ada).
 */
export default function JourneyCategoryManager({
  categories,
  onFeedback,
}: {
  categories: JourneyCategory[]
  /** Notifikasi hasil aksi (sukses/error) ke section pemanggil. */
  onFeedback?: (fb: { status: 'success' | 'error'; message: string }) => void
}) {
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(
    action: () => Promise<unknown>,
    failMsg: string,
    okMsg?: string,
  ) {
    setBusy(true)
    try {
      await action()
      if (okMsg) onFeedback?.({ status: 'success', message: okMsg })
    } catch (err) {
      onFeedback?.({
        status: 'error',
        message: `${failMsg}: ${toastErrMsg(err)}`,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    const last = categories[categories.length - 1]
    await run(
      () => addJourneyCategory(name, (last?.position ?? 0) + 1),
      'Gagal menambah kategori',
      `Kategori "${name}" ditambahkan.`,
    )
    setNewName('')
  }

  async function handleMove(cat: JourneyCategory, dir: -1 | 1) {
    const idx = categories.findIndex((c) => c.id === cat.id)
    const target = categories[idx + dir]
    if (!target) return
    await run(
      () => swapJourneyCategories(cat, target),
      'Gagal mengubah urutan',
      'Urutan kategori disimpan.',
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-hairline bg-surface p-4">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Kelola Kategori Perjalanan
      </p>
      {categories.length === 0 && (
        <p className="text-sm text-white/25">Belum ada kategori.</p>
      )}
      {categories.map((cat, idx) => (
        <div
          key={cat.id}
          className="flex items-center gap-2 rounded-md border border-hairline bg-background/50 px-2 py-1.5"
        >
          <div className="flex gap-1">
            <MiniBtn
              title="Naikkan urutan"
              disabled={idx === 0 || busy}
              onClick={() => void handleMove(cat, -1)}
            >
              ↑
            </MiniBtn>
            <MiniBtn
              title="Turunkan urutan"
              disabled={idx === categories.length - 1 || busy}
              onClick={() => void handleMove(cat, 1)}
            >
              ↓
            </MiniBtn>
          </div>
          <InlineText
            className="min-w-0 flex-1 font-mono text-sm"
            value={cat.name}
            placeholder="Nama kategori…"
            ariaLabel="Edit nama kategori perjalanan"
            onSave={async (v) => {
              const name = v.trim()
              if (name && name !== cat.name) {
                await run(
                  () => renameJourneyCategory(cat.id, name),
                  'Gagal mengubah nama kategori',
                  'Nama kategori disimpan.',
                )
              }
            }}
          />
          <MiniBtn
            title="Hapus kategori"
            tone="danger"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  `Hapus kategori "${cat.name}"? Cerita yang memakainya jadi tanpa kategori (datanya tetap ada).`,
                )
              ) {
                void run(
                  () => deleteJourneyCategory(cat.id),
                  'Gagal menghapus kategori',
                  'Kategori dihapus.',
                )
              }
            }}
          >
            ✕
          </MiniBtn>
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleAdd()
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          className="w-full flex-1 rounded-md border border-hairline bg-surface-3 px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-white/45 focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Kategori baru (misal: Pendidikan, Pengalaman)"
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
