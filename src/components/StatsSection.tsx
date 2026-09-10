import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEditMode } from '../context/EditModeContext'
import { addStat } from '../lib/mutations'
import type { Stat } from '../types'

function StatItem({ stat }: { stat: Stat }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const animateValue = () => {
    const start = 0
    const end = stat.value
    const duration = 1500
    const startTime = performance.now()

    function updateCount(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(start + (end - start) * easeOut)

      if (mounted) {
        ;(document.getElementById(`stat-value-${stat.id}`) as HTMLSpanElement).textContent =
          current.toLocaleString()
      }

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    requestAnimationFrame(updateCount)
  }

  useEffect(() => {
    if (mounted) {
      animateValue()
    }
  }, [mounted])

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {stat.label}
      </p>
      <h2 className="text-5xl font-extrabold tracking-tight">
        {stat.value > 0 ? stat.value.toLocaleString() : '0'}
      </h2>
    </div>
  )
}

export default function StatsSection() {
  const { enabled, toast } = useEditMode()
  const [stats, setStats] = useState<Stat[]>([])

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('stats').select('*').order('position', { ascending: true })
      if (error) throw error
      setStats(data as Stat[])
    })()
  }, [])

  useEffect(() => {
    if (enabled) {
      ;(async () => {
        const { data, error } = await supabase.from('stats').select('*').order('position', { ascending: true })
        if (error) throw error
        setStats(data as Stat[])
      })()
    }
  }, [enabled])

  const handleAddStat = async (label: string, value: number) => {
    const position = stats.length > 0 ? Math.max(...stats.map((s) => s.position)) + 1 : 1
    const newId = await addStat(label, value, position)
    setStats([
      ...stats,
      {
        id: newId,
        label,
        value,
        position,
        visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    toast?.('success', 'Statistik ditambahkan.')
  }

  return (
    <section
      id="stats"
      className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:pt-48 lg:pb-64"
    >
      <div className="flex flex-col sm:flex-row gap-6 sm:items-end sm:space-0">
        <div className="space-y-8">
          {stats.map((stat, idx) => (
            <div key={stat.id} className="reveal" style={{ animationDelay: `${idx * 100}ms` }}>
              <StatItem stat={stat} />
            </div>
          ))}
        </div>

        {enabled && (
          <div className="mt-6 p-4 border border-hairline bg-surface rounded-lg">
            <h3 className="text-sm font-medium tracking-tight text-muted mb-2">Tambah Statistik</h3>
            <input
              className="w-full border rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Label (mis. Project Selesai)"
            />
            <div className="flex gap-2">
              <input
                className="w-20 border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                type="number"
                min="0"
                placeholder="Nilai"
              />
              <button
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover text-sm"
                onClick={() => handleAddStat('', 0)}
              >
                Tambah
              </button>
            </div>
          </div>
        )}

        <div className="hidden sm:block sm:w-1/2 sm:p-6">
          <div className="h-96 border-dashed border-hairline rounded-lg flex items-center justify-center text-muted">
            <span className="text-xs">Desain visual statistik akan segera hadir</span>
          </div>
        </div>
      </div>
    </section>
  )
}