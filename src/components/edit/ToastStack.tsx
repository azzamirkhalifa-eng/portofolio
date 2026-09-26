export type ToastStatus = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  status: ToastStatus
  message: string
}

type ToastStackProps = {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

const styles: Record<ToastStatus, string> = {
  success: 'border-emerald-400/30 text-emerald-400',
  error: 'border-red-400/30 text-red-400',
  info: 'border-faint/20 text-foreground',
}

/** Tumpukan notifikasi kecil di tengah bawah layar. */
export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[95] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto max-w-md animate-fade-up rounded-md border bg-background/95 px-4 py-2 text-sm shadow-lg shadow-black/40 backdrop-blur ${styles[toast.status]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
