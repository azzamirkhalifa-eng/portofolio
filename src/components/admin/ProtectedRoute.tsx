import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getSession, onAuthStateChange } from '../../lib/auth'

type ProtectedRouteProps = {
  children: ReactNode
}

/**
 * Proteksi route admin: kalau belum login, redirect ke /admin/login.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<'loading' | 'authed' | 'guest'>(
    'loading',
  )

  useEffect(() => {
    let active = true

    void getSession().then(({ data }) => {
      if (active) setStatus(data.session ? 'authed' : 'guest')
    })

    const { data: sub } = onAuthStateChange((_event, session) => {
      if (active) setStatus(session ? 'authed' : 'guest')
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-accent" />
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}