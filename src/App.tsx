import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import HomePage from './pages/HomePage'
import AchievementsPage from './pages/AchievementsPage'
import AchievementDetailPage from './pages/AchievementDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import JourneyPage from './pages/JourneyPage'
import JourneyDetailPage from './pages/JourneyDetailPage'
import ProtectedRoute from './components/admin/ProtectedRoute'
import RevealObserver from './components/RevealObserver'
import { EditModeProvider } from './context/EditModeContext'
import { LanguageProvider } from './context/LanguageContext'

/* Halaman admin di-lazy-load supaya tidak membebani bundle publik. */
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted">
      <span className="font-mono text-xs uppercase tracking-[0.2em]">
        Memuat…
      </span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Bahasa aktif (ID/EN) tersedia di SEMUA halaman; preferensi
          tersimpan di localStorage. */}
      <LanguageProvider>
      {/* Mode Edit (status login, toggle, toast) tersedia di SEMUA
          halaman — publik maupun dashboard admin. */}
      <EditModeProvider>
        {/* Scroll-reveal global: elemen .reveal muncul saat masuk layar */}
        <RevealObserver />
      <Suspense fallback={<AdminFallback />}>
        <Routes>
        {/* Halaman publik: satu alur scroll (Home) + halaman project */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/achievements/:slug" element={<AchievementDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          {/* Halaman Perjalanan (timeline cerita) */}
          <Route path="/perjalanan" element={<JourneyPage />} />
          <Route path="/perjalanan/:slug" element={<JourneyDetailPage />} />
          {/* Link lama /about & /contact tetap jalan → scroll ke section-nya */}
          <Route path="/about" element={<Navigate to="/#about" replace />} />
          <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* /admin → redirect ke dashboard (tetap diproteksi) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </EditModeProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}