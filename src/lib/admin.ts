/**
 * Email admin — SATU-SATUNYA akun yang boleh menulis data.
 * Nilai ini HARUS sama persis dengan auth.email() di policy RLS
 * (lihat supabase/schema.sql) dan email user admin di Supabase Auth.
 * Frontend hanya memakai ini untuk menyembunyikan/menampilkan UI edit —
 * keamanan sebenarnya tetap dipegang RLS di sisi Supabase.
 */
export const ADMIN_EMAIL = 'azzamirkhalifa@gmail.com'

export function isAdminEmail(
  email: string | null | undefined,
): boolean {
  return (
    typeof email === 'string' &&
    email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  )
}
