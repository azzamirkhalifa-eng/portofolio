import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEditMode } from '../context/EditModeContext'
import { addProses } from '../lib/mutations'
import type { Proses } from '../types'

export default function ProsesSection() {
  const { enabled, toast } = useEditMode()
  const [proses, setProses] = useState<Proses[]>([])

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('proses').select('*').order('position', { ascending: true })
      if (error) throw error
      setProses(data as Proses[])
    })()
  }, [])

  useEffect(() => {
    if (enabled) {
      ;(async () => {
        const { data, error } = await supabase.from('proses').select('*').order('position', { ascending: true })
        if (error) throw error
        setProses(data as Proses[])
      })()
    }
  }, [enabled])

  const handleAddProses = async (icon: string, description: string) => {
    const position = proses.length > 0 ? Math.max(...proses.map((p) => p.position)) + 1 : 1
    const newId = await addProses(position, icon, description)
    setProses([
      ...proses,
      {
        id: newId,
        position,
        icon,
        description,
        visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    toast?.('success', 'Langkah kerja ditambahkan.')
  }

  return (
    <section
      id="proses"
      className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:pt-48 lg:pb-64"
    >
      <div className="max-w-2xl">
        {proses.map((proses, idx) => (
          <div key={proses.id} className="flex items-start gap-3 reveal" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="w-10 h-10 rounded-lg border border-hairline bg-surface flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-mono">{proses.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium tracking-tight text-foreground">
                {proses.description}
              </h3>
            </div>
          </div>
        ))}

        {enabled && (
          <div className="mt-6 p-4 border border-hairline bg-surface rounded-lg">
            <h3 className="text-sm font-medium tracking-tight text-muted mb-2">Tambah Langkah Kerja</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                className="col-span-2 w-full border rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="Ikon (mis. ⚙️ atau riqet)"
              />
              <input
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="Deskripsi singkat (mis. Riset pasal user)"
              />
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-2 bg-accent text-white rounded-md hover:bg-accent-hover text-sm"
                onClick={() => handleAddProses('', '')}
              >
                Tambah
              </button>
              <button
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm disabled:opacity-50"
                disabled={proses.length >= 4}
              >
                Maks 4 langkah
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 h-40 border-dashed border-hairline rounded-lg flex items-center justify-center text-muted">
          <span className="text-xs">Desain visual alur kerja akan segera hadir</span>
        </div>
      </div>
    </section>
  )
}