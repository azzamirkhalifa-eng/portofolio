import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { Category } from '../types'

/** Ambil daftar kategori (diurutkan position) + subscribe realtime. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('position', { ascending: true })

      if (!error && active) {
        setCategories(data ?? [])
      }
      if (active) {
        setLoading(false)
      }
    }

    void fetchCategories()

    const unsubscribe = subscribeToTable('categories', () => {
      void fetchCategories()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { categories, loading }
}
