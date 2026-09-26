import { useState, type FormEvent } from 'react'
import { sendMessage } from '../lib/mutations'
import {
  formatCooldown,
  getContactCooldownMs,
  markContactSent,
} from '../lib/contactThrottle'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'

type Errors = { name?: string; email?: string; message?: string }

const inputCls =
  'w-full rounded-md border border-hairline bg-surface-3 px-3 py-2.5 text-sm text-foreground placeholder:text-faint/45 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40'

const labelCls =
  'mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted'

/**
 * Validasi dasar: field wajib tidak kosong, format email valid, dan panjang
 * maksimal wajar (selaras dengan CHECK constraint di tabel `messages`).
 * Validasi ini untuk UX; batas sebenarnya tetap ditegakkan database.
 */
function validate(
  name: string,
  email: string,
  message: string,
  lang: 'id' | 'en',
): Errors {
  const errors: Errors = {}
  const n = name.trim()
  const e = email.trim()
  const m = message.trim()

  if (!n) errors.name = t(ui.namaKosong, lang)
  else if (n.length > 100) errors.name = t(ui.namaPanjang, lang)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    errors.email = t(ui.emailInvalid, lang)
  } else if (e.length > 200) {
    errors.email = t(ui.emailPanjang, lang)
  }

  if (!m) errors.message = t(ui.pesanKosong, lang)
  else if (m.length > 2000) errors.message = t(ui.pesanPanjang, lang)

  return errors
}

export default function ContactForm() {
  const { lang } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  // Peringatan rate limit (kirim terlalu cepat).
  const [tooFast, setTooFast] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSendError(null)
    setTooFast(null)

    // Rate limit: tolak kalau belum lewat jeda 1 menit sejak kiriman sukses.
    const cooldown = getContactCooldownMs()
    if (cooldown > 0) {
      setTooFast(`${t(ui.terlaluCepat, lang)} (${formatCooldown(cooldown)})`)
      return
    }

    const nextErrors = validate(name, email, message, lang)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSending(true)
    try {
      await sendMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      markContactSent()
      setSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
      setErrors({})
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : t(ui.gagalMengirim, lang),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-10 max-w-xl">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {t(ui.kirimPesan, lang)}
      </h3>

      {/* Pesan sukses setelah terkirim */}
      {success && (
        <p
          role="status"
          className="mt-4 rounded-md border border-emerald-400/30 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-400"
        >
          {t(ui.pesanSukses, lang)}
        </p>
      )}

      {/* Error kirim (mis. jaringan) */}
      {sendError && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-400"
        >
          {t(ui.gagalMengirim, lang)}
        </p>
      )}

      {/* Peringatan mengirim terlalu cepat (rate limit) */}
      {tooFast && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm text-amber-400"
        >
          {tooFast}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t(ui.nama, lang)}</span>
          <input
            className={inputCls}
            value={name}
            maxLength={100}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
            }}
            placeholder={t(ui.namaPlaceholder, lang)}
            aria-invalid={!!errors.name}
            disabled={sending}
          />
          {errors.name && (
            <span className="mt-1 block text-xs text-red-400">{errors.name}</span>
          )}
        </label>

        <label className="block">
          <span className={labelCls}>{t(ui.email, lang)}</span>
          <input
            className={inputCls}
            type="email"
            value={email}
            maxLength={200}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
            }}
            placeholder="kamu@email.com"
            aria-invalid={!!errors.email}
            disabled={sending}
          />
          {errors.email && (
            <span className="mt-1 block text-xs text-red-400">{errors.email}</span>
          )}
        </label>
      </div>

      <label className="mt-4 block">
        <span className={labelCls}>{t(ui.pesan, lang)}</span>
        <textarea
          className={`${inputCls} min-h-32 resize-y`}
          value={message}
          maxLength={2000}
          onChange={(e) => {
            setMessage(e.target.value)
            if (errors.message) setErrors((p) => ({ ...p, message: undefined }))
          }}
          placeholder={t(ui.pesanPlaceholder, lang)}
          aria-invalid={!!errors.message}
          disabled={sending}
        />
        {errors.message && (
          <span className="mt-1 block text-xs text-red-400">{errors.message}</span>
        )}
      </label>

      <button
        type="submit"
        disabled={sending}
        className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {sending ? t(ui.mengirim, lang) : t(ui.kirimPesan, lang)}
      </button>
    </form>
  )
}
