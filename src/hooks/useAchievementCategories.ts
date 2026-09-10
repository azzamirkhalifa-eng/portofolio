import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { AchievementCategory } from '../types'

/**
 * Ambil daftar kategori pencapaian + subscribe realtime.
 * Diurutkan per `position` (urutan yang diatur admin).
 */
export function useAchievementCategories() {
  const [categories, setCategories] = useState<AchievementCategory[]>([])

  useEffect(() => {
    let active = true

    async function fetchCategories() {
      const { data, error } = await supabase
        .from('achievement_categories')
        .select('*')
        .order('position', { ascending: true })

      if (!error && active) {
        setCategories(data ?? [])
      }
    }

    void fetchCategories()

    const unsubscribe = subscribeToTable('achievement_categories', () => {
      void fetchCategories()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { categories }
}
