import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getSession, signInWithPassword } from '../../lib/auth'
import { Feedback, inputCls, labelCls } from '../../components/admin/FormControls'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Kalau sudah login, langsung ke dashboard
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let active = true
    void getSession().then(({ data }) => {
      if (!active) return
      setAuthed(Boolean(data.session))
      setChecking(false)
    })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)
    const { session, error } = await signInWithPassword(
      email.trim(),
      password,
    )
    setLoading(false)

    if (error || !session) {
      setError(
        error?.message.toLowerCase().includes('invalid login credentials')
          ? 'Email atau password salah. Coba lagi.'
          : `Login gagal: ${error?.message ?? 'terjadi kesalahan.'}`,
      )
      return
    }

    navigate('/admin/dashboard', { replace: true })
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-accent" />
      </div>
    )
  }

  if (authed) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Masuk<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Login dengan akun admin untuk mengelola konten website.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-lg border border-hairline bg-surface p-6"
        >
          <label className="block">
            <span className={labelCls}>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className={labelCls}>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </label>

          <Feedback status={error ? 'error' : null} message={error} />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? 'Memproses…' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/25">
          Kembali ke website{' '}
          <a href="/" className="text-accent hover:underline">
            →
          </a>
        </p>
      </div>
    </div>
  )
}