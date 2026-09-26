import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useSkills } from '../../hooks/useSkills'
import { Feedback, inputCls } from './FormControls'
import type { Skill } from '../../types'

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
      className="flex h-7 w-7 items-center justify-center rounded border border-hairline text-muted transition-colors hover:border-faint/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function SkillRow({
  skill,
  first,
  last,
  busy,
  onRename,
  onDelete,
  onMove,
}: {
  skill: Skill
  first: boolean
  last: boolean
  busy: boolean
  onRename: (skill: Skill, label: string) => Promise<void>
  onDelete: (skill: Skill) => Promise<void>
  onMove: (skill: Skill, dir: -1 | 1) => Promise<void>
}) {
  const [label, setLabel] = useState(skill.label)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-surface p-3">
      <div className="flex gap-1.5">
        <ArrowButton
          label="Naikkan urutan"
          disabled={first || busy}
          onClick={() => void onMove(skill, -1)}
        >
          ↑
        </ArrowButton>
        <ArrowButton
          label="Turunkan urutan"
          disabled={last || busy}
          onClick={() => void onMove(skill, 1)}
        >
          ↓
        </ArrowButton>
      </div>

      <form
        className="flex min-w-0 flex-1 items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void onRename(skill, label)
        }}
      >
        <input
          className={`${inputCls} flex-1`}
          value={label}
          disabled={busy}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md border border-hairline px-3 py-2 text-sm text-foreground transition-colors hover:border-faint/25 hover:bg-surface-2 disabled:opacity-50"
        >
          Save
        </button>
      </form>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onDelete(skill)}
        className="shrink-0 rounded-md border border-hairline px-3 py-2 text-sm text-muted transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
      >
        Hapus
      </button>
    </div>
  )
}

export default function SkillsSection() {
  const { skills, loading } = useSkills()
  const [newLabel, setNewLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return

    setBusy(true)
    setFeedback(null)
    const last = skills[skills.length - 1]
    const { error } = await supabase
      .from('skills')
      .insert({ label, position: (last?.position ?? 0) + 1 })

    setBusy(false)
    if (error) {
      setFeedback({ status: 'error', message: `Gagal menambah: ${error.message}` })
    } else {
      setNewLabel('')
      setFeedback({ status: 'success', message: `Skill "${label}" ditambahkan.` })
    }
  }

  async function handleRename(skill: Skill, label: string) {
    const trimmed = label.trim()
    if (!trimmed || trimmed === skill.label) return
    setBusy(true)
    setFeedback(null)
    const { error } = await supabase
      .from('skills')
      .update({ label: trimmed })
      .eq('id', skill.id)
    setBusy(false)
    if (error) {
      setFeedback({ status: 'error', message: `Gagal menyimpan: ${error.message}` })
    } else {
      setFeedback({ status: 'success', message: 'Perubahan disimpan.' })
    }
  }

  async function handleDelete(skill: Skill) {
    if (!confirm(`Hapus skill "${skill.label}"?`)) return
    setBusy(true)
    setFeedback(null)
    const { error } = await supabase.from('skills').delete().eq('id', skill.id)
    setBusy(false)
    if (error) {
      setFeedback({ status: 'error', message: `Gagal menghapus: ${error.message}` })
    } else {
      setFeedback({ status: 'success', message: `Skill "${skill.label}" dihapus.` })
    }
  }

  /** Tukar posisi dua skill berurutan (↑/↓). */
  async function handleMove(skill: Skill, dir: -1 | 1) {
    const idx = skills.findIndex((s) => s.id === skill.id)
    const target = skills[idx + dir]
    if (!target) return

    setBusy(true)
    setFeedback(null)
    const { error: e1 } = await supabase
      .from('skills')
      .update({ position: target.position })
      .eq('id', skill.id)
    const { error: e2 } = await supabase
      .from('skills')
      .update({ position: skill.position })
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
    return <div className="h-48 animate-pulse rounded-lg border border-hairline bg-surface" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Skills<span className="text-accent-text">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Badge skill yang tampil di section About. Urutkan dengan tombol ↑/↓,
          edit label per baris, hapus, atau tambah skill baru.
        </p>
      </div>

      <Feedback status={feedback?.status ?? null} message={feedback?.message ?? null} />

      {/* Daftar skill */}
      <div className="space-y-2">
        {skills.length === 0 && (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
            Belum ada skill. Tambahkan lewat form di bawah.
          </p>
        )}
        {skills.map((skill, idx) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            first={idx === 0}
            last={idx === skills.length - 1}
            busy={busy}
            onRename={handleRename}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        ))}
      </div>

      {/* Tambah skill */}
      <form
        onSubmit={handleAdd}
        className="flex items-end gap-2 rounded-lg border border-hairline bg-surface p-4"
      >
        <div className="flex-1">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            Skill Baru
          </span>
          <input
            className={inputCls}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="misal: Next.js"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !newLabel.trim()}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Tambah
        </button>
      </form>
    </div>
  )
}