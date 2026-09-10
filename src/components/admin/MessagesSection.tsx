import { useState } from 'react'
import { deleteMessage, markMessageRead } from '../../lib/mutations'
import { useMessages } from '../../hooks/useMessages'
import { Feedback } from './FormControls'
import type { Message } from '../../types'

type FeedbackState = { status: 'success' | 'error'; message: string } | null

/** Format waktu masuk pesan (lokal, mis. "9 Sep 2026, 14.32"). */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageRow({
  msg,
  busy,
  onMarkRead,
  onDelete,
}: {
  msg: Message
  busy: boolean
  onMarkRead: (msg: Message) => Promise<void>
  onDelete: (msg: Message) => Promise<void>
}) {
  return (
    <div
      className={`rounded-lg border bg-surface p-4 ${
        msg.is_read ? 'border-hairline' : 'border-accent/40'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* Badge "belum dibaca": dot accent + label */}
        {!msg.is_read && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Baru
          </span>
        )}
        <span className={`text-sm font-medium ${msg.is_read ? 'text-muted' : 'text-foreground'}`}>
          {msg.name}
        </span>
        <a
          href={`mailto:${msg.email}`}
          className="font-mono text-xs text-accent hover:underline"
        >
          {msg.email}
        </a>
        <span className="ml-auto font-mono text-[10px] text-white/30">
          {formatTime(msg.created_at)}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
        {msg.message}
      </p>

      <div className="mt-3 flex gap-2">
        {!msg.is_read && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onMarkRead(msg)}
            className="rounded-md border border-hairline px-3 py-1.5 text-xs text-foreground transition-colors hover:border-white/25 hover:bg-surface-2 disabled:opacity-50"
          >
            Tandai sudah dibaca
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDelete(msg)}
          className="rounded-md border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
        >
          Hapus
        </button>
      </div>
    </div>
  )
}

export default function MessagesSection() {
  const { messages, loading } = useMessages()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const unreadCount = messages.filter((m) => !m.is_read).length

  async function handleMarkRead(msg: Message) {
    setBusy(true)
    setFeedback(null)
    try {
      await markMessageRead(msg.id)
      setFeedback({ status: 'success', message: 'Pesan ditandai sudah dibaca.' })
    } catch (err) {
      setFeedback({
        status: 'error',
        message: err instanceof Error ? err.message : 'Gagal memperbarui pesan.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(msg: Message) {
    if (!confirm(`Hapus pesan dari "${msg.name}"?`)) return
    setBusy(true)
    setFeedback(null)
    try {
      await deleteMessage(msg.id)
      setFeedback({ status: 'success', message: 'Pesan dihapus.' })
    } catch (err) {
      setFeedback({
        status: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus pesan.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Pesan Masuk<span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pesan dari form kontak. {unreadCount > 0
            ? `${unreadCount} belum dibaca (ditandai "Baru").`
            : 'Semua sudah dibaca.'}
        </p>
      </div>

      <Feedback status={feedback?.status ?? null} message={feedback?.message ?? null} />

      {loading ? (
        <div className="h-48 animate-pulse rounded-lg border border-hairline bg-surface" />
      ) : messages.length === 0 ? (
        <p className="rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
          Belum ada pesan masuk. Pesan dari form kontak akan muncul di sini
          secara otomatis.
        </p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              busy={busy}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
