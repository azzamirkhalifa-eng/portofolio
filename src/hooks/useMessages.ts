import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import type { Message } from '../types'

/**
 * Ambil daftar pesan (tab admin "Pesan Masuk") + subscribe realtime.
 * Query hanya berhasil kalau yang login admin (RLS) — untuk pengunjung
 * anon hasilnya otomatis kosong.
 */
export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && active) {
        setMessages(data ?? [])
      }
      if (active) {
        setLoading(false)
      }
    }

    void fetchMessages()

    const unsubscribe = subscribeToTable('messages', () => {
      void fetchMessages()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { messages, loading }
}
