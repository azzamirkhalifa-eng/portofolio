import { useEffect, useRef, useState } from 'react'
import { uploadImage } from '../../lib/storage'
import type { CropContext } from '../../lib/cropPresets'
import { MiniBtn } from './controls'
import CropFrameModal from './CropFrameModal'
import type { ProjectButton } from '../../types'

/** Id unik untuk tombol baru (tanpa dependensi). */
function newButtonId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `btn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const editorInputCls =
  'w-full rounded-md border border-hairline bg-surface-3 px-2 py-1.5 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-white/45 focus:border-accent/60 focus:ring-1 focus:ring-accent/30'

/* ============================================================
 * Editor galeri project (multi-gambar).
 * Setiap perubahan langsung memanggil onChange — pemakai yang
 * memutuskan apakah langsung disimpan ke DB atau ke state form.
 * ============================================================ */

type GalleryEditorProps = {
  images: string[]
  onChange: (next: string[]) => void | Promise<void>
  folder: 'avatars' | 'projects' | 'achievements'
  /**
   * Konteks bingkai (Fitur 1). Diisi → pilih 1 foto membuka modal crop
   * ala Canva dulu (pilih bingkai → drag/zoom); pilih banyak foto tetap
   * langsung upload semua (bulk). Kosong → perilaku lama.
   */
  cropContext?: CropContext
  cropTitle?: string
}

export function GalleryEditor({
  images,
  onChange,
  folder,
  cropContext,
  cropTitle = 'Foto Galeri',
}: GalleryEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  /** Foto tunggal yang menunggu di-crop sebelum masuk galeri. */
  const [cropFile, setCropFile] = useState<File | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    // Satu foto + konteks bingkai → buka modal crop dulu.
    if (cropContext && files.length === 1) {
      setCropFile(files[0])
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        urls.push(await uploadImage(file, folder))
      }
      await onChange([...images, ...urls])
    } catch (err) {
      window.alert(
        `Upload gagal: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      )
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /** Hasil crop modal galeri → upload + tambah ke daftar. */
  async function handleCropped(cropped: File) {
    setUploading(true)
    try {
      const url = await uploadImage(cropped, folder)
      await onChange([...images, url])
      setCropFile(null)
    } catch (err) {
      window.alert(
        `Upload gagal: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      )
    } finally {
      setUploading(false)
    }
  }

  async function addFromUrl() {
    const url = urlInput.trim()
    if (!url) return
    setUrlInput('')
    await onChange([...images, url])
  }

  async function removeAt(index: number) {
    await onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {images.length === 0 && (
        <p className="text-xs text-white/30">Belum ada gambar galeri.</p>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="group relative">
              <img
                src={src}
                alt=""
                className="h-16 w-24 rounded-md border border-hairline object-cover"
              />
              <button
                type="button"
                aria-label="Hapus gambar"
                title="Hapus gambar"
                onClick={() => void removeAt(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/25 bg-black/80 text-[10px] text-white transition-colors hover:text-red-300"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-white/25 hover:bg-surface-2 disabled:opacity-50"
        >
          {uploading ? 'Mengunggah…' : '+ Upload Gambar'}
        </button>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void addFromUrl()
            }
          }}
          placeholder="…atau tempel URL gambar"
          className={`${editorInputCls} min-w-0 flex-1`}
        />
        <MiniBtn
          title="Tambah dari URL"
          tone="accent"
          disabled={!urlInput.trim() || uploading}
          onClick={() => void addFromUrl()}
        >
          +
        </MiniBtn>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {/* Modal crop untuk upload tunggal (Fitur 1) — hasil mengalir ke
          pipeline kompresi Feature 2 via uploadImage(). */}
      {cropFile && cropContext && (
        <CropFrameModal
          file={cropFile}
          context={cropContext}
          title={cropTitle}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropped}
        />
      )}
    </div>
  )
}

/* ============================================================
 * Editor spesifikasi fleksibel (key-value).
 * Baris diedit dulu, lalu hasilnya dikirim ke onChange setelah
 * jeda ketik (~600ms) supaya tidak menulis DB setiap tombol.
 * ============================================================ */

type SpecRow = { k: string; v: string }

type SpecsEditorProps = {
  specs: Record<string, string>
  onChange: (next: Record<string, string>) => void | Promise<void>
}

function toRows(specs: Record<string, string>): SpecRow[] {
  return Object.entries(specs).map(([k, v]) => ({ k, v }))
}

function toSpecs(rows: SpecRow[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of rows) {
    const k = row.k.trim()
    if (k) out[k] = row.v
  }
  return out
}

export function SpecsEditor({ specs, onChange }: SpecsEditorProps) {
  const [rows, setRows] = useState<SpecRow[]>(() => toRows(specs))
  const lastSynced = useRef(JSON.stringify(specs))
  const timerRef = useRef(0)

  // Sinkron dari luar (mis. hasil realtime) hanya kalau bukan hasil
  // ketikan sendiri — supaya tidak menimpa teks yang sedang diketik.
  useEffect(() => {
    const json = JSON.stringify(specs)
    if (json !== lastSynced.current) {
      setRows(toRows(specs))
      lastSynced.current = json
    }
  }, [specs])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function push(updated: SpecRow[]) {
    setRows(updated)
    const next = toSpecs(updated)
    const json = JSON.stringify(next)
    lastSynced.current = json
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void onChange(next)
    }, 600)
  }

  function updateRow(index: number, field: 'k' | 'v', value: string) {
    push(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    push([...rows, { k: '', v: '' }])
  }

  function removeRow(index: number) {
    push(rows.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-white/30">Belum ada spesifikasi.</p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={row.k}
            onChange={(e) => updateRow(i, 'k', e.target.value)}
            placeholder="Label, mis. Peran"
            aria-label={`Label spesifikasi ${i + 1}`}
            className={`${editorInputCls} w-2/5 shrink-0`}
          />
          <input
            value={row.v}
            onChange={(e) => updateRow(i, 'v', e.target.value)}
            placeholder="Nilai, mis. Frontend Developer"
            aria-label={`Nilai spesifikasi ${i + 1}`}
            className={`${editorInputCls} min-w-0 flex-1`}
          />
          <MiniBtn
            title="Hapus baris"
            tone="danger"
            onClick={() => removeRow(i)}
          >
            ✕
          </MiniBtn>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full rounded-md border border-dashed border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        + Tambah Spesifikasi
      </button>
    </div>
  )
}

/* ============================================================
 * Editor spesifikasi DUA BAHASA (key-value, ID + EN berdampingan).
 * Key diambil dari baris ID — mengubah label ID otomatis mengubah
 * key di kedua versi. Nilai EN kosong = fallback ke ID saat render.
 * ============================================================ */

type SpecRowBilingual = { k: string; v: string; vEn: string }

function toBilingualSpecRows(specs: Record<string, string>, specsEn: Record<string, string>): SpecRowBilingual[] {
  return Object.entries(specs).map(([k, v]) => ({ k, v, vEn: specsEn[k] ?? '' }))
}

function toBilingualSpecs(rows: SpecRowBilingual[]): {
  specs: Record<string, string>
  specsEn: Record<string, string>
} {
  const specs: Record<string, string> = {}
  const specsEn: Record<string, string> = {}
  for (const row of rows) {
    const k = row.k.trim()
    if (!k) continue
    specs[k] = row.v
    if (row.vEn.trim() !== '') specsEn[k] = row.vEn
  }
  return { specs, specsEn }
}

export function SpecsEditorBilingual({
  specs,
  specsEn,
  onChange,
}: {
  specs: Record<string, string>
  specsEn: Record<string, string>
  onChange: (next: { specs: Record<string, string>; specsEn: Record<string, string> }) => void | Promise<void>
}) {
  const [rows, setRows] = useState<SpecRowBilingual[]>(() =>
    toBilingualSpecRows(specs, specsEn),
  )
  const lastSynced = useRef(JSON.stringify({ specs, specsEn }))
  const timerRef = useRef(0)

  useEffect(() => {
    const json = JSON.stringify({ specs, specsEn })
    if (json !== lastSynced.current) {
      setRows(toBilingualSpecRows(specs, specsEn))
      lastSynced.current = json
    }
  }, [specs, specsEn])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function push(updated: SpecRowBilingual[]) {
    setRows(updated)
    const next = toBilingualSpecs(updated)
    const json = JSON.stringify(next)
    lastSynced.current = json
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void onChange(next)
    }, 600)
  }

  function updateRow(index: number, field: 'k' | 'v' | 'vEn', value: string) {
    push(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-white/30">Belum ada spesifikasi.</p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="rounded-md border border-hairline bg-background/40 p-2">
          <div className="flex items-center gap-2">
            <input
              value={row.k}
              onChange={(e) => updateRow(i, 'k', e.target.value)}
              placeholder="Label, mis. Peran"
              aria-label={`Label spesifikasi ${i + 1}`}
              className={`${editorInputCls} w-2/5 shrink-0`}
            />
            <input
              value={row.v}
              onChange={(e) => updateRow(i, 'v', e.target.value)}
              placeholder="Nilai (Indonesia)"
              aria-label={`Nilai spesifikasi ${i + 1} (Indonesia)`}
              className={`${editorInputCls} min-w-0 flex-1`}
            />
            <MiniBtn
              title="Hapus baris"
              tone="danger"
              onClick={() => push(rows.filter((_, idx) => idx !== i))}
            >
              ✕
            </MiniBtn>
          </div>
          <input
            value={row.vEn}
            onChange={(e) => updateRow(i, 'vEn', e.target.value)}
            placeholder="Value (English) — kosong = pakai versi Indonesia"
            aria-label={`Nilai spesifikasi ${i + 1} (English)`}
            className={`${editorInputCls} mt-1.5 min-w-0 flex-1`}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => push([...rows, { k: '', v: '', vEn: '' }])}
        className="w-full rounded-md border border-dashed border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        + Tambah Spesifikasi
      </button>
    </div>
  )
}

/* ============================================================
 * Editor tombol aksi project DUA BAHASA.
 * Label EN per tombol; kosong = pakai label Indonesia.
 * ============================================================ */

type ButtonRowBilingual = { id: string; label: string; url: string; labelEn: string }

function toBilingualButtonRows(
  buttons: ProjectButton[] | undefined | null,
  buttonsEn: ProjectButton[] | undefined | null,
): ButtonRowBilingual[] {
  const enById = new Map((buttonsEn ?? []).map((b) => [b.id, b.label_en ?? b.label]))
  return (buttons ?? []).map((b) => ({
    id: b.id,
    label: b.label,
    url: b.url,
    labelEn: enById.get(b.id) ?? '',
  }))
}

function toBilingualButtons(rows: ButtonRowBilingual[]): {
  buttons: ProjectButton[]
  buttonsEn: ProjectButton[]
} {
  const buttons: ProjectButton[] = []
  const buttonsEn: ProjectButton[] = []
  for (const r of rows) {
    const label = r.label.trim()
    const url = r.url.trim()
    if (label === '' && url === '') continue
    buttons.push({ id: r.id, label, url })
    const labelEn = r.labelEn.trim()
    if (labelEn !== '') buttonsEn.push({ id: r.id, label: labelEn, url: '' })
  }
  return { buttons, buttonsEn }
}

export function ButtonsEditorBilingual({
  buttons,
  buttonsEn,
  onChange,
}: {
  buttons: ProjectButton[] | undefined | null
  buttonsEn: ProjectButton[] | undefined | null
  onChange: (next: { buttons: ProjectButton[]; buttonsEn: ProjectButton[] }) => void | Promise<void>
}) {
  const [rows, setRows] = useState<ButtonRowBilingual[]>(() =>
    toBilingualButtonRows(buttons, buttonsEn),
  )
  const lastSynced = useRef(
    JSON.stringify({ buttons: buttons ?? [], buttonsEn: buttonsEn ?? [] }),
  )
  const timerRef = useRef(0)

  useEffect(() => {
    const json = JSON.stringify({ buttons: buttons ?? [], buttonsEn: buttonsEn ?? [] })
    if (json !== lastSynced.current) {
      setRows(toBilingualButtonRows(buttons, buttonsEn))
      lastSynced.current = json
    }
  }, [buttons, buttonsEn])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function push(updated: ButtonRowBilingual[]) {
    setRows(updated)
    const next = toBilingualButtons(updated)
    const json = JSON.stringify(next)
    lastSynced.current = json
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void onChange(next)
    }, 600)
  }

  function updateRow(index: number, field: 'label' | 'url' | 'labelEn', value: string) {
    push(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  function moveRow(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    push(next)
  }

  function removeRow(index: number) {
    push(rows.filter((_, i) => i !== index))
  }

  function addRow() {
    push([...rows, { id: newButtonId(), label: '', url: '', labelEn: '' }])
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-white/30">Belum ada tombol.</p>
      )}

      {rows.map((row, i) => (
        <div key={row.id} className="space-y-1.5 rounded-md border border-hairline bg-background/40 p-2">
          <div className="flex items-center gap-1.5">
            <MiniBtn
              title="Naikkan urutan"
              disabled={i === 0}
              onClick={() => moveRow(i, -1)}
            >
              ↑
            </MiniBtn>
            <MiniBtn
              title="Turunkan urutan"
              disabled={i === rows.length - 1}
              onClick={() => moveRow(i, 1)}
            >
              ↓
            </MiniBtn>
            <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
              Tombol {i + 1}
            </span>
            <MiniBtn
              title="Hapus tombol"
              tone="danger"
              className="ml-auto"
              onClick={() => removeRow(i)}
            >
              ✕
            </MiniBtn>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={row.label}
              onChange={(e) => updateRow(i, 'label', e.target.value)}
              placeholder="Label (Indonesia), mis. Live Demo"
              aria-label={`Label tombol ${i + 1} (Indonesia)`}
              className={`${editorInputCls} w-2/5 shrink-0`}
            />
            <input
              value={row.url}
              onChange={(e) => updateRow(i, 'url', e.target.value)}
              placeholder="https://… (opsional)"
              aria-label={`URL tombol ${i + 1}`}
              className={`${editorInputCls} min-w-0 flex-1`}
            />
          </div>
          <input
            value={row.labelEn}
            onChange={(e) => updateRow(i, 'labelEn', e.target.value)}
            placeholder="Label (English) — kosong = pakai versi Indonesia"
            aria-label={`Label tombol ${i + 1} (English)`}
            className={`${editorInputCls} w-full`}
          />
          {i === 0 && (
            <p className="ml-12 mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
              Opsional — kosongkan URL kalau tidak ingin berupa link.
            </p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full rounded-md border border-dashed border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        + Tambah Tombol
      </button>

      <p className="mt-1 font-mono text-[11px] text-white/35">
        Tombol pertama tampil solid, sisanya garis tepi. Kosongkan kolom
        URL kalau tombol tidak ingin mengarah ke link.
      </p>
    </div>
  )
}

/* ============================================================
 * Editor tombol aksi project (label + URL, bisa banyak).
 * Tombol ini tampil di atas halaman detail project — tombol
 * pertama tampil solid (accent), sisanya ghost. Baris diedit
 * dulu, hasil dikirim ke onChange setelah jeda ketik (~600ms).
 * ============================================================ */

type ButtonRow = ProjectButton

function toButtonRows(buttons: ProjectButton[] | undefined | null): ButtonRow[] {
  return (buttons ?? []).map((b) => ({ id: b.id, label: b.label, url: b.url }))
}

function toButtons(rows: ButtonRow[]): ProjectButton[] {
  return rows
    .map((r) => ({
      id: r.id,
      label: r.label.trim(),
      url: r.url.trim(),
    }))
    // Baris yang benar-benar kosong (label & url kosong) diabaikan.
    .filter((r) => r.label !== '' || r.url !== '')
}

export function ButtonsEditor({
  buttons,
  onChange,
}: {
  buttons: ProjectButton[] | undefined | null
  onChange: (next: ProjectButton[]) => void | Promise<void>
}) {
  const [rows, setRows] = useState<ButtonRow[]>(() => toButtonRows(buttons))
  const lastSynced = useRef(JSON.stringify(buttons ?? []))
  const timerRef = useRef(0)

  // Sinkron dari luar (mis. hasil realtime) hanya kalau bukan hasil
  // ketikan sendiri — supaya tidak menimpa teks yang sedang diketik.
  useEffect(() => {
    const json = JSON.stringify(buttons ?? [])
    if (json !== lastSynced.current) {
      setRows(toButtonRows(buttons))
      lastSynced.current = json
    }
  }, [buttons])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function push(updated: ButtonRow[]) {
    setRows(updated)
    const next = toButtons(updated)
    const json = JSON.stringify(next)
    lastSynced.current = json
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void onChange(next)
    }, 600)
  }

  function updateRow(index: number, field: 'label' | 'url', value: string) {
    push(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  function moveRow(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    push(next)
  }

  function removeRow(index: number) {
    push(rows.filter((_, i) => i !== index))
  }

  function addRow() {
    push([...rows, { id: newButtonId(), label: '', url: '' }])
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-white/30">Belum ada tombol.</p>
      )}

      {rows.map((row, i) => (
        <div key={row.id} className="space-y-1.5 rounded-md border border-hairline bg-background/40 p-2">
          <div className="flex items-center gap-1.5">
            <MiniBtn
              title="Naikkan urutan"
              disabled={i === 0}
              onClick={() => moveRow(i, -1)}
            >
              ↑
            </MiniBtn>
            <MiniBtn
              title="Turunkan urutan"
              disabled={i === rows.length - 1}
              onClick={() => moveRow(i, 1)}
            >
              ↓
            </MiniBtn>
            <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
              Tombol {i + 1}
            </span>
            <MiniBtn
              title="Hapus tombol"
              tone="danger"
              className="ml-auto"
              onClick={() => removeRow(i)}
            >
              ✕
            </MiniBtn>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={row.label}
              onChange={(e) => updateRow(i, 'label', e.target.value)}
              placeholder="Label, mis. Live Demo"
              aria-label={`Label tombol ${i + 1}`}
              className={`${editorInputCls} w-2/5 shrink-0`}
            />
            <input
              value={row.url}
              onChange={(e) => updateRow(i, 'url', e.target.value)}
              placeholder="https://… (opsional)"
              aria-label={`URL tombol ${i + 1}`}
              className={`${editorInputCls} min-w-0 flex-1`}
            />
          </div>
          {i === 0 && (
            <p className="ml-12 mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
              Opsional — kosongkan URL kalau tidak ingin berupa link.
            </p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full rounded-md border border-dashed border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        + Tambah Tombol
      </button>

      <p className="mt-1 font-mono text-[11px] text-white/35">
        Tombol pertama tampil solid, sisanya garis tepi. Kosongkan kolom
        URL kalau tombol tidak ingin mengarah ke link.
      </p>
    </div>
  )
}