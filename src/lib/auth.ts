import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Login admin dengan email + password (Supabase Auth). */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { session: data.session, error }
}

/** Logout admin. */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/** Ambil session saat ini (null kalau belum login). */
export function getSession() {
  return supabase.auth.getSession()
}

/** Subscribe perubahan status login (login/logout). */
export function onAuthStateChange(
  callback: (_event: string, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback)
}