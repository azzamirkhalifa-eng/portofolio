import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { Achievement } from '../types'

/**
 * Ambil daftar achievement/sertifikat + subscribe realtime.
 * Diurutkan per `position` (urutan yang diatur admin).
 */
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchAchievements() {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('position', { ascending: true })

      if (!error && active) {
        setAchievements(data ?? [])
      }
      if (active) {
        setLoading(false)
      }
    }

    void fetchAchievements()

    const unsubscribe = subscribeToTable('achievements', () => {
      void fetchAchievements()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { achievements, loading }
}
