import { useEffect, useRef, useState } from 'react'
import type { FeatureItem, Project } from '../../types'
import { updateProject } from '../../lib/mutations'
import { uploadImage } from '../../lib/storage'
import { effectiveFeatureItems, NUMBERED_LINE } from '../../lib/featureItems'
import { MiniBtn } from './controls'
import CropFrameModal from './CropFrameModal'
import InlineText from './InlineText'

/** Sama gayanya dengan input editor lain (DetailEditors/InlineText). */
const editorInputCls =
  'w-full rounded-md border border-hairline bg-surface-3 px-2 py-1.5 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-faint/45 focus:border-accent/60 focus:ring-1 focus:ring-accent/30'

/** Id unik untuk poin baru (tanpa dependensi). */
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `fi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Rekonstruksi full_description dari teks lama + poin-poin sekarang:
 * HANYA blok list bernomor yang diganti, sementara paragraf pembuka
 * DAN paragraf lain di luar list (mis. catatan penutup) dipertahankan —
 * tidak ada teks yang hilang saat admin menyunting poin fitur.
 *
 * Aturan (selaras 3 kondisi wajib Tahap B):
 * - Teks tanpa baris bernomor → kembali apa adanya (+ poin baru
 *   ditambahkan di bawahnya bila ada).
 * - Poin tanpa teks dilewati & penomoran tetap urut tanpa lompat.
 */
function rebuildDescription(base: string, next: FeatureItem[], en: boolean): string {
  const lines = base.replace(/\r\n/g, '\n').split('\n')
  const firstNum = lines.findIndex((l) => NUMBERED_LINE.test(l))
  let lastNum = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (NUMBERED_LINE.test(lines[i])) {
      lastNum = i
      break
    }
  }
  // Prosa sebelum list (intro) & sesudah list (catatan penutup, dll).
  const head =
    firstNum > 0 ? lines.slice(0, firstNum).join('\n').trim() : firstNum === -1 ? base.trim() : ''
  const tail = lastNum >= 0 ? lines.slice(lastNum + 1).join('\n').trim() : ''
  let n = 0
  const numbered = next
    .map((it) => {
      const body = (en ? it.text_en || it.text : it.text).trim()
      return body !== '' ? `${++n}. ${body.replace(/\n+/g, ' ')}` : null
    })
    .filter((s): s is string => s !== null)
  return [head, numbered.join('\n'), tail].filter((s) => s !== '').join('\n\n')
}

/**
 * Editor poin fitur (feature_items) di Mode Edit — halaman detail project.
 *
 * Per poin: judul & teks bilingual, gambar opsional (upload → modal crop
 * ala Canva → storage 'projects'), pindah urutan ↑/↓, hapus. Perubahan
 * di-debounce 600ms lalu disimpan ke kolom jsonb `feature_items`;
 * full_description (ID & EN) direkonstruksi otomatis agar fallback tetap benar.
 */
export default function FeatureItemsEditor({ project }: { project: Project }) {
  // Salinan lokal sebagai sumber kebenaran tampilan (pola editor lain).
  const [items, setItems] = useState<FeatureItem[]>(() =>
    effectiveFeatureItems(project),
  )
  const lastSynced = useRef(JSON.stringify(project.feature_items ?? []))
  const timerRef = useRef(0)
  const fileInputs = useRef<(HTMLInputElement | null)[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** File yang menunggu modal crop + indeks poin tujuannya. */
  const [cropFile, setCropFile] = useState<{ index: number; file: File } | null>(
    null,
  )

  // Sync dari luar (realtime DB) — hanya bila JSON DB benar-benar berubah.
  useEffect(() => {
    const json = JSON.stringify(project.feature_items ?? [])
    if (json !== lastSynced.current) {
      setItems(effectiveFeatureItems(project))
      lastSynced.current = json
      setSaving(false)
    }
  }, [project])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  /** Simpan: feature_items + rekonstruksi full_description (ID & EN). */
  async function persist(next: FeatureItem[]) {
    setSaving(true)
    setError(null)
    try {
      // Poin kosong total (tanpa teks, judul, DAN gambar) tidak ikut
      // disimpan. Poin bergambar tetap dipertahankan walau teksnya
      // masih kosong — kerja admin tidak boleh hilang saat menyimpan.
      const clean = next.filter(
        (it) =>
          it.text.trim() !== '' ||
          it.title.trim() !== '' ||
          it.image_url.trim() !== '',
      )
      const effective = clean.length > 0 ? clean : []
      await updateProject(project.id, {
        feature_items: effective,
        full_description: rebuildDescription(
          project.full_description ?? '',
          effective,
          false,
        ),
        full_description_en: rebuildDescription(
          project.full_description_en ?? '',
          effective,
          true,
        ),
      })
      lastSynced.current = JSON.stringify(effective)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  function push(next: FeatureItem[]) {
    setItems(next)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => void persist(next), 600)
  }

  function updateItem(index: number, patch: Partial<FeatureItem>) {
    push(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function addItem() {
    push([
      ...items,
      { id: newId(), title: '', title_en: '', text: '', text_en: '', image_url: '' },
    ])
  }

  function removeItem(index: number) {
    if (!window.confirm(`Hapus poin fitur ${index + 1}?`)) return
    push(items.filter((_, i) => i !== index))
  }

  function moveItem(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    push(next)
  }

  /** Hasil crop → upload → simpan URL ke poin. */
  async function handleCropped(cropped: File) {
    if (!cropFile) return
    const index = cropFile.index
    setCropFile(null)
    setSaving(true)
    setError(null)
    try {
      const url = await uploadImage(cropped, 'projects')
      const next = items.map((it, i) =>
        i === index ? { ...it, image_url: url } : it,
      )
      setItems(next)
      await persist(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal.')
    } finally {
      setSaving(false)
    }
  }

  /** Ganti foto yang sudah ada: fetch URL → jadikan File untuk modal crop. */
  async function handleRecrop(index: number) {
    const src = items[index]?.image_url
    if (!src) return
    setError(null)
    try {
      const res = await fetch(src, { mode: 'cors' })
      if (!res.ok) throw new Error('Foto tidak dapat dimuat.')
      const blob = await res.blob()
      const ext = (blob.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg')
      setCropFile({
        index,
        file: new File([blob], `existing.${ext}`, {
          type: blob.type || 'image/jpeg',
        }),
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat foto untuk di-crop ulang.',
      )
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-accent/40 bg-accent-subtle p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent-text">
          Poin Fitur ({items.length})
        </p>
        {saving && (
          <span className="font-mono text-[10px] text-muted">menyimpan…</span>
        )}
        <MiniBtn
          title="Tambah poin fitur"
          tone="accent"
          className="ml-auto"
          onClick={addItem}
        >
          +
        </MiniBtn>
      </div>
      {error && <p className="mt-2 font-mono text-[11px] text-red-400">{error}</p>}

      <div className="mt-3 space-y-3">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="rounded-md border border-hairline bg-background/40 p-2.5"
          >
            <div className="flex items-center gap-1.5">
              <MiniBtn
                title="Naikkan urutan"
                disabled={i === 0}
                onClick={() => moveItem(i, -1)}
              >
                ↑
              </MiniBtn>
              <MiniBtn
                title="Turunkan urutan"
                disabled={i === items.length - 1}
                onClick={() => moveItem(i, 1)}
              >
                ↓
              </MiniBtn>
              <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.15em] text-faint/25">
                Poin {i + 1}
              </span>
              <MiniBtn
                title="Hapus poin"
                tone="danger"
                className="ml-auto"
                onClick={() => removeItem(i)}
              >
                ✕
              </MiniBtn>
            </div>

            <input
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              placeholder="Judul poin (opsional, Indonesia)"
              aria-label={`Judul poin fitur ${i + 1} (Indonesia)`}
              className={`${editorInputCls} mt-2`}
            />
            <InlineText
              value={item.text}
              onSave={async (v) => updateItem(i, { text: v })}
              multiline
              ariaLabel={`Teks poin fitur ${i + 1} (Indonesia)`}
              className="mt-1.5"
            />
            <input
              value={item.title_en}
              onChange={(e) => updateItem(i, { title_en: e.target.value })}
              placeholder="Judul (English) — kosong = pakai versi Indonesia"
              aria-label={`Judul poin fitur ${i + 1} (English)`}
              className={`${editorInputCls} mt-1.5`}
            />
            <InlineText
              value={item.text_en}
              onSave={async (v) => updateItem(i, { text_en: v })}
              multiline
              ariaLabel={`Teks poin fitur ${i + 1} (English)`}
              className="mt-1.5"
            />

            {/* Gambar poin — preview kecil + upload/ganti/hapus */}
            <div className="mt-2.5 flex items-center gap-2.5">
              {item.image_url ? (
                <>
                  <img
                    src={item.image_url}
                    alt=""
                    className="h-12 w-16 rounded border border-hairline object-cover"
                  />
                  <MiniBtn title="Ganti gambar" onClick={() => void handleRecrop(i)}>
                    ⧉
                  </MiniBtn>
                  <MiniBtn
                    title="Hapus gambar"
                    tone="danger"
                    onClick={() => updateItem(i, { image_url: '' })}
                  >
                    ␥
                  </MiniBtn>
                  <span className="font-mono text-[10px] text-faint/30">
                    gambar terpasang
                  </span>
                </>
              ) : (
                <>
                  <MiniBtn
                    title="Unggah gambar"
                    tone="accent"
                    onClick={() => fileInputs.current[i]?.click()}
                  >
                    ⬆
                  </MiniBtn>
                  <span className="font-mono text-[10px] text-faint/30">
                    tanpa gambar (teks-saja)
                  </span>
                </>
              )}
              <input
                ref={(el) => {
                  fileInputs.current[i] = el
                }}
                type="file"
                accept="image/*"
                className="hidden"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setCropFile({ index: i, file: f })
                  e.target.value = ''
                }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="font-mono text-[11px] text-faint/30">
            Belum ada poin fitur. Klik + untuk menambah.
          </p>
        )}
      </div>

      {cropFile && (
        <CropFrameModal
          file={cropFile.file}
          context="gallery"
          title={`Gambar Poin ${cropFile.index + 1}`}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropped}
        />
      )}
    </div>
  )
}
