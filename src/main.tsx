import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import './index.css'
import './styles/typography.css'
import App from './App.tsx'

// Preconnect ke host Supabase (API + storage gambar) sedini mungkin,
// sebelum query data & foto pertama diunduh — hemat DNS + TLS handshake.
try {
  const host = new URL(import.meta.env.VITE_SUPABASE_URL as string).host
  if (host) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = `https://${host}`
    link.crossOrigin = ''
    document.head.appendChild(link)
  }
} catch {
  // URL env tidak valid/tersedia — biarkan tanpa preconnect.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
