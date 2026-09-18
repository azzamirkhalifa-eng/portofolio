/** URL dipakai apa adanya; kalau tanpa skema, anggap https (untuk builder). */
export function safeHrefBuilder(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
