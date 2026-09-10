import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { Project } from '../types'

/**
 * Ambil daftar project (grid di section Projects) + subscribe realtime.
 * Urutan tampil mengikuti kolom `position` (kecil dulu).
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('position', { ascending: true })

      if (!error && active) {
        setProjects(data ?? [])
      }
      if (active) {
        setLoading(false)
      }
    }

    void fetchProjects()

    const unsubscribe = subscribeToTable('projects', () => {
      void fetchProjects()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { projects, loading }
}