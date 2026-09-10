import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { CustomSection } from '../types'

/** Ambil semua custom section (diurutkan position) + subscribe realtime. */
export function useCustomSections() {
  const [sections, setSections] = useState<CustomSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchSections() {
      const { data, error } = await supabase
        .from('custom_sections')
        .select('*')
        .order('position', { ascending: true })

      if (!error && active) {
        setSections(data ?? [])
      }
      if (active) {
        setLoading(false)
      }
    }

    void fetchSections()

    const unsubscribe = subscribeToTable('custom_sections', () => {
      void fetchSections()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { sections, loading }
}
