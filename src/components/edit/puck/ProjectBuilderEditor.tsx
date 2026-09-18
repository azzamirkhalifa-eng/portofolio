import { useCallback, useEffect, useRef, useState } from 'react'
import { Puck, type Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import { useEditMode } from '../../../context/EditModeContext'
import { useLanguage } from '../../../context/LanguageContext'
import { updateProject } from '../../../lib/mutations'
import { builderDocToFeatureItems, newBuilderId } from '../../../lib/builderData'
import { parseBuilderDoc, type BuilderDoc } from '../../../types/builder'
import type { Project } from '../../../types'
import { builderConfig, setBuilderLang } from './builderConfig'

type ProjectBuilderEditorProps = {
  /** Project yang sedang diedit (doc awal = builder_json atau default). */
  project: Project
  /** Dokumen builder awal (dihitung parent sekali, sebelum mount). */
  doc: BuilderDoc
  /** Dipanggil setelah overlay tertutup — parent melepas komponen ini. */
  onDone: () => void
}

/**
 * Overlay builder fullscreen (z-80 — di atas halaman, di bawah toggle
 * Mode Edit z-90, toast z-95 & modal crop z-100). Editor Puck menggantung
 * tanpa iframe (iframe: false) — komponen Tailwind project dirender
 * langsung, jadi tema 100% identik dengan halaman publik.
 *
 * Simpan: onChange Puck → konversi ke BuilderDoc → debounce 600ms →
 * updateProject({ builder_json, feature_items }) — pola debounce sama
 * dengan editor lama. feature_items ditulis balik (dua arah masa
 * transisi) supaya editor lama & renderer lama tetap konsisten dengan
 * hasil builder; elemen non-feature hanya hidup di builder_json.
 *
 * Tombol "Simpan & Tutup" di header Puck (via dictionary) menutup
 * overlay setelah flush simpan terakhir — toast menampilkan hasilnya.
 *
 * Realtime: useProjects me-refresh row project setelah simpan, tapi doc
 * dari DB TIDAK pernah diterapkan ke state editor yang terbuka (prop
 * `data` Puck hanya dibaca saat mount) — editor adalah sumber kebenaran
 * selama sesi editing.
 */
export default function ProjectBuilderEditor({
  project,
  doc,
  onDone,
}: ProjectBuilderEditorProps) {
  const { toast } = useEditMode()
  const { lang } = useLanguage()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef(0)
  const docRef = useRef<BuilderDoc>(doc)
  const lastSavedJson = useRef(JSON.stringify(doc))

  // Bahasa render canvas mengikuti toggle EN/ID admin — config membaca
  // lewat setBuilderLang/getLang (satu sumber, dipakai editor & preview).
  useEffect(() => {
    setBuilderLang(lang)
  }, [lang])

  // Buka setelah frame pertama — transisi fade-in halus.
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setOpen(true))
    return () => window.cancelAnimationFrame(raf)
  }, [])

  // Kunci scroll body selama overlay terbuka (pola sama dengan modal
  // crop/lightbox) — pulihkan posisi scroll saat overlay ditutup.
  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      window.scrollTo(0, scrollY)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  /** Simpan doc ke DB. Return: berhasil (atau memang tidak ada perubahan)? */
  async function persist(current: BuilderDoc): Promise<boolean> {
    const json = JSON.stringify(current)
    if (json === lastSavedJson.current) return true
    try {
      await updateProject(project.id, {
        builder_json: current,
        feature_items: builderDocToFeatureItems(current),
      })
      lastSavedJson.current = json
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan.'
      setError(msg)
      toast('error', `Builder: ${msg}`)
      return false
    }
  }

  /** onChange Puck → konversi Data → BuilderDoc → debounce persist. */
  const handleChange = useCallback(
    (data: Data) => {
      const content = data.content ?? []
      const elements: BuilderDoc['elements'] = content.map((item) => {
        const rec = item as { type?: string; props?: Record<string, unknown> }
        // `id` milik level elemen (el.id) — tidak diduplikasi di props.
        const { _wb, _al, id: _elementId, ...rest } = rec.props ?? {}
        return {
          // Id bawaan Puck (uuid) — fallback generator bila elemen baru
          // belum membawa id.
          id: typeof rest.id === 'string' && rest.id !== '' ? rest.id : newBuilderId(),
          type: (rec.type ?? '') as BuilderDoc['elements'][number]['type'],
          props: rest,
          style: {
            width: _wb === 'wide' || _wb === 'half' || _wb === 'small' ? _wb : 'full',
            align: _al === 'center' || _al === 'right' ? _al : 'left',
          },
        }
      })
      const parsed = parseBuilderDoc({ version: 1, elements })
      if (!parsed) return
      docRef.current = parsed
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => void persist(parsed), 600)
    },
    // persist membaca ref & state terkini — aman tanpa dependensi tambahan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.id],
  )

  /** Flush simpan terakhir, fade-out, lalu laporkan & tutup. */
  function requestClose() {
    window.clearTimeout(timerRef.current)
    void persist(docRef.current).then((ok) => {
      setOpen(false)
      // Beri waktu animasi fade-out sebelum dilepas parent.
      window.setTimeout(() => {
        if (ok) toast('info', 'Builder ditutup — perubahan tersimpan.')
        // Bila gagal: toast error sudah dikirim persist; tetap tutup —
        // perubahan terakhir tetap ada di state editor bila dibuka lagi.
        onDone()
      }, 220)
    })
  }

  // Label tombol Publish Puck → bahasa kita (kamus bawaan Puck).
  const dictionary = { 'header-publish': 'Simpan & Tutup' }

  return (
    <div
      className={`fixed inset-0 z-80 bg-background transition-opacity duration-200 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Visual page builder"
    >
      <Puck
        config={builderConfig}
        data={{
          content: doc.elements.map((el) => ({
            type: el.type,
            props: {
              ...el.props,
              id: el.id,
              _wb: el.style.width,
              _al: el.style.align,
            } as Record<string, unknown>,
          })),
          root: {},
        }}
        onChange={handleChange}
        onPublish={() => requestClose()}
        dictionary={dictionary}
        iframe={{ enabled: false }}
        headerTitle={`Builder — ${project.title || 'Project'}`}
        headerPath={`/projects/${project.slug}`}
      />
      {error && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-red-400/40 bg-red-950/80 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
