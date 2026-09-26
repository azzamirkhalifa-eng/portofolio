import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/auth'

const tabs = [
  { id: 'profile', label: 'Profile & Hero', index: '01' },
  { id: 'skills', label: 'Skills', index: '02' },
  { id: 'projects', label: 'Projects', index: '03' },
  { id: 'achievements', label: 'Pencapaian', index: '04' },
  { id: 'journey', label: 'Perjalanan', index: '05' },
  { id: 'featured', label: 'Tampil di Beranda', index: '06' },
  { id: 'messages', label: 'Pesan Masuk', index: '07' },
] as const

export type TabId = (typeof tabs)[number]['id']

type AdminLayoutProps = {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export default function AdminLayout({
  activeTab,
  onTabChange,
  children,
}: AdminLayoutProps) {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    setSigningOut(true)
    const { error } = await signOut()
    if (error) {
      setSigningOut(false)
      return
    }
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a
            href="/"
            className="font-mono text-sm font-medium tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            admin<span className="text-accent-text">.</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-md border border-hairline px-4 py-2 text-sm text-muted transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
          >
            <svg
              aria-hidden
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {signingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row">
        {/* Sidebar / menu section */}
        <aside className="shrink-0 lg:w-56">
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'border-accent/50 bg-accent/5 text-foreground'
                      : 'border-hairline text-muted hover:border-faint/20 hover:text-foreground'
                  }`}
                >
                  <span className="font-mono text-[10px] text-accent-text">
                    {tab.index}
                  </span>
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}