import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { Skill } from '../types'

/**
 * Ambil daftar skill (badge di section About) + subscribe realtime.
 */
export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchSkills() {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('position', { ascending: true })

      if (!error && active) {
        setSkills(data ?? [])
      }
      if (active) {
        setLoading(false)
      }
    }

    void fetchSkills()

    const unsubscribe = subscribeToTable('skills', () => {
      void fetchSkills()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { skills, loading }
}