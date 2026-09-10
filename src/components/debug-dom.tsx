// FILE HANYA UNTUK DEBUG - bisa dihapus setelah masalah ditemukan.
// Tempel komponen ini di PublicLayout atau HomePage untuk lihat elemen apa yang muncul.
import { useEffect, useState } from 'react'

export default function DebugDom() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const handleClick = () => setCount((c) => c + 1)
    window.addEventListener('keydown', handleClick)
    return () => window.removeEventListener('keydown', handleClick)
  }, [])

  return (
    <pre
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        background: '#000',
        color: '#0f0',
        padding: 8,
        fontFamily: 'monospace',
        fontSize: 12,
        maxHeight: '20vh',
        overflow: 'auto',
      }}
    >
      Key presses: {count}
    </pre>
  )
}
