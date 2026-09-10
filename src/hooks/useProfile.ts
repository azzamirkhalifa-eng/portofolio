import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { Profile } from '../types'

/**
 * Ambil data profile (baris id=1) + subscribe realtime.
 * Setiap perubahan dari dashboard admin langsung tampil di halaman publik.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (!error && active) {
        setProfile(data)
      }
      if (active) {
        setLoading(false)
      }
    }

    void fetchProfile()

    const unsubscribe = subscribeToTable('profile', () => {
      void fetchProfile()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { profile, loading }
}