/**
 * RichText — renderer teks deskripsi multi-baris dengan deteksi
 * "list bernomor" otomatis.
 *
 * Aturan render:
 * - Baris yang diawali pola angka + titik/kurung tutup + spasi
 *   (mis. "1. ", "2) ") dianggap item list bernomor → item berurutan
 *   dirender sebagai <ol> dengan badge angka aksen (lingkaran biru
 *   kecil) di kiri teks, bukan angka polos menyatu dengan kalimat.
 * - Baris lain dikelompokkan sebagai paragraf biasa; line break
 *   eksplisit tetap dipertahankan (whitespace-pre-line).
 *
 * Dipakai untuk deskripsi panjang (halaman detail project/pencapaian,
 * about_text, custom section) supaya tembok teks lebih mudah dibaca.
 */

type OrderedItem = { num: string; text: string }

type Segment =
  | { kind: 'prose'; lines: string[] }
  | { kind: 'ordered'; items: OrderedItem[] }

/** "1. teks", "12) teks", dst — maksimal 3 digit biar tidak salah tangkap (mis. "1.5 jam" tetap paragraf). */
const NUMBERED_LINE = /^\s*(\d{1,3})[.)]\s+(.*)$/

function parseRichSegments(text: string): Segment[] {
  const segments: Segment[] = []
  let prose: string[] = []
  let items: OrderedItem[] = []

  const flushProse = () => {
    if (prose.length > 0) {
      segments.push({ kind: 'prose', lines: prose })
      prose = []
    }
  }
  const flushItems = () => {
    if (items.length > 0) {
      segments.push({ kind: 'ordered', items })
      items = []
    }
  }

  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const match = NUMBERED_LINE.exec(line)
    if (match) {
      flushProse()
      items.push({ num: match[1], text: match[2] })
    } else {
      flushItems()
      prose.push(line)
    }
  }
  flushProse()
  flushItems()
  return segments
}

type RichTextProps = {
  text: string
  /** Kelas kontainer (warna teks, line-height, margin, dsb) — diwarisi paragraf & item. */
  className?: string
}

/** Badge angka aksen — lingkaran kecil biru di kiri teks item list. */
export function NumberBadge({ n }: { n: string }) {
  return (
    <span
      aria-hidden
      className="mt-1 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-accent-soft bg-accent-subtle px-1 font-mono text-[11px] font-semibold leading-none text-accent-text"
    >
      {n}
    </span>
  )
}

export default function RichText({ text, className = '' }: RichTextProps) {
  const segments = parseRichSegments(text)

  return (
    <div className={`space-y-5 ${className}`}>
      {segments.map((seg, i) =>
        seg.kind === 'prose' ? (
          <p key={i} className="whitespace-pre-line">
            {seg.lines.join('\n')}
          </p>
        ) : (
          <ol key={i} className="space-y-1.5">
            {seg.items.map((item, j) => (
              <li
                key={j}
                className={`flex items-start gap-3 rounded-lg px-3.5 py-3 ${
                  /* Latar selang-seling sangat tipis: item GENAP (urutan
                     ke-2, ke-4, …) dapat tint biru ±4% (token
                     --color-accent-faint) — ganjil transparan. */
                  j % 2 === 1 ? 'bg-accent-faint' : ''
                } ${
                  /* Garis pembatas antar item (bukan di atas item
                     pertama) — pakai hairline-strong (lebih terang dari
                     hairline biasa) supaya batas poin lebih tegas. */
                  j > 0 ? 'border-t border-hairline-strong' : ''
                }`}
              >
                <NumberBadge n={item.num} />
                <span className="min-w-0 flex-1">{item.text}</span>
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  )
}
