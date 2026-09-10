import { useState } from 'react'
import SectionBox from './ui/SectionBox'
import InlineText from './edit/InlineText'
import InlineTextBilingual from './edit/InlineTextBilingual'
import InlineImage from './edit/InlineImage'
import { GhostBtn, MiniBtn, selectCls } from './edit/controls'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import { pick } from '../lib/i18n'
import {
  addCustomSection,
  deleteCustomSection,
  swapPositions,
  updateCustomSection,
} from '../lib/mutations'
import type { CustomSection, CustomSectionZone } from '../types'

type CustomZoneProps = {
  zone: CustomSectionZone
  /** Blok zona ini, sudah difilter & diurutkan position. */
  sections: CustomSection[]
}

function BlockBody({
  section,
  editing,
}: {
  section: CustomSection
  editing: boolean
}) {
  const { lang } = useLanguage()
  const titleBlock = (
    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
      <InlineTextBilingual
        valueId={section.title}
        valueEn={section.title_en ?? ''}
        enabled={editing}
        ariaLabel="Edit judul blok"
        placeholder="Judul blok…"
        placeholderEn="Block title…"
        onSaveId={async (v) => {
          await updateCustomSection(section.id, { title: v })
        }}
        onSaveEn={async (v) => {
          await updateCustomSection(section.id, { title_en: v })
        }}
      />
    </h2>
  )
  const textBlock = (
    <div className="mt-3 whitespace-pre-line leading-relaxed text-muted">
      <InlineTextBilingual
        valueId={section.text}
        valueEn={section.text_en ?? ''}
        enabled={editing}
        multiline
        ariaLabel="Edit isi blok"
        placeholder="Tulis konten blok di sini…"
        placeholderEn="Write the block content here…"
        onSaveId={async (v) => {
          await updateCustomSection(section.id, { text: v })
        }}
        onSaveEn={async (v) => {
          await updateCustomSection(section.id, { text_en: v })
        }}
      />
    </div>
  )
  const linkBlock =
    section.link_label || section.link_url || editing ? (
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {section.link_url && !editing ? (
          <a
            href={section.link_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {pick(section.link_label, section.link_label_en, lang) || 'Buka link'}
            <span aria-hidden>↗</span>
          </a>
        ) : (
          <>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
              Link opsional
            </span>
            <InlineTextBilingual
              className="font-mono text-xs text-accent"
              valueId={section.link_label}
              valueEn={section.link_label_en ?? ''}
              enabled={editing}
              placeholder="Teks tombol (misal: Lihat GitHub)"
              placeholderEn="Button text (e.g. View GitHub)"
              ariaLabel="Edit label link"
              onSaveId={async (v) => {
                await updateCustomSection(section.id, { link_label: v })
              }}
              onSaveEn={async (v) => {
                await updateCustomSection(section.id, { link_label_en: v })
              }}
            />
            <InlineText
              className="min-w-40 flex-1 font-mono text-xs text-muted"
              value={section.link_url}
              placeholder="https://…"
              ariaLabel="Edit URL link"
              onSave={async (v) => {
                await updateCustomSection(section.id, { link_url: v.trim() })
              }}
            />
          </>
        )}
      </div>
    ) : null

  // Layout teks saja
  if (section.layout === 'text') {
    return (
      <div className="mx-auto max-w-3xl">
        {titleBlock}
        {textBlock}
        {linkBlock}
      </div>
    )
  }

  // Layout teks + gambar
  return (
    <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
      <div>
        {titleBlock}
        {textBlock}
        {linkBlock}
      </div>
      <div>
        <InlineImage
          src={section.image_url}
          alt={section.title || 'Gambar blok'}
          folder="projects"
          uploadLabel="Tambah Gambar"
          shapeClass="rounded-lg"
          onSave={async (url) => {
            await updateCustomSection(section.id, { image_url: url })
          }}
        >
          {section.image_url ? (
            <img
              src={section.image_url}
              alt={section.title || 'Gambar blok'}
              loading="lazy"
              className="block h-auto max-h-[28rem] w-full rounded-lg border border-hairline object-contain"
            />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg border border-hairline bg-surface font-mono text-xs uppercase tracking-[0.3em] text-white/15">
              {editing ? 'Klik untuk upload' : 'Belum ada gambar'}
            </div>
          )}
        </InlineImage>
      </div>
    </div>
  )
}

/**
 * Zona custom section — dirender di antara section inti.
 * Publik: blok terlihat apa adanya. Mode Edit: tiap blok bisa
 * diedit inline, diurutkan, disembunyikan, dihapus; plus tombol
 * "+ Tambah Section di sini".
 */
export default function CustomZone({ zone, sections }: CustomZoneProps) {
  const { enabled, toast } = useEditMode()
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>, failMsg: string) {
    setBusy(true)
    try {
      await action()
    } catch (err) {
      toast(
        'error',
        `${failMsg}: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
      )
    } finally {
      setBusy(false)
    }
  }  function renderBlock(section: CustomSection, idx: number, isHidden: boolean) {
    return (
      <SectionBox key={section.id} className="!my-0 !py-10 sm:!py-12">
        {/* Kontrol blok (mode edit) */}
        {enabled && (
          <div
            className={`mb-4 flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 ${
              isHidden
                ? 'border-dashed border-white/15 opacity-70'
                : 'border-hairline bg-background/40'
            }`}
          >
            <MiniBtn
              title="Naikkan urutan"
              disabled={idx === 0 || busy}
              onClick={() =>
                void run(
                  () => swapPositions('custom_sections', section, sections[idx - 1]),
                  'Gagal mengubah urutan',
                )
              }
            >
              ↑
            </MiniBtn>
            <MiniBtn
              title="Turunkan urutan"
              disabled={idx === sections.length - 1 || busy}
              onClick={() =>
                void run(
                  () => swapPositions('custom_sections', section, sections[idx + 1]),
                  'Gagal mengubah urutan',
                )
              }
            >
              ↓
            </MiniBtn>

            <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
              Blok
            </span>
            <select
              className={selectCls}
              value={section.layout}
              onChange={(e) =>
                void run(
                  () =>
                    updateCustomSection(section.id, {
                      layout: e.target.value as 'text' | 'text-image',
                    }),
                  'Gagal mengganti tata letak',
                )
              }
            >
              <option value="text">Teks saja</option>
              <option value="text-image">Teks + gambar</option>
            </select
            >

            <GhostBtn
              title={isHidden ? 'Tampilkan blok' : 'Sembunyikan blok (sementara)'}
              disabled={busy}
              onClick={() =>
                void run(
                  () =>
                    updateCustomSection(section.id, {
                      visible: !section.visible,
                    }),
                  'Gagal mengubah visibilitas',
                )
              }
            >
              {isHidden ? 'Tampilkan' : 'Sembunyikan'}
            </GhostBtn>
            <MiniBtn
              title="Hapus blok"
              tone="danger"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Hapus blok${section.title ? ` "${section.title}"` : ''}?`,
                  )
                ) {
                  void run(
                    () => deleteCustomSection(section.id),
                    'Gagal menghapus blok',
                  )
                }
              }}
            >
              ✕
            </MiniBtn>
          </div>
        )}
        {/* Isi blok — sembunyikan dari publik, tapi tetap tampil (redup) untuk admin */}
        {isHidden && !enabled ? null : (
          <div className={isHidden ? 'opacity-50' : ''}>
            <BlockBody section={section} editing={enabled} />
          </div>
        )}
        {isHidden && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
            • blok disembunyikan untuk pengunjung
          </p>
        )}
      </SectionBox>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Blok per zona (blok tersembunyi hanya terlihat admin, diredupkan) */}
      {sections.map((section, idx) => {
        const isHidden = !section.visible
        if (isHidden && !enabled) return null
        return renderBlock(section, idx, isHidden)
      })}

      {/* Tombol tambah blok (edit mode) */}
      {enabled && (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(
              async () => {
                const last = sections[sections.length - 1]
                await addCustomSection(zone, (last?.position ?? 0) + 1)
              },
              'Gagal menambah blok',
            )
          }
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
        >
          + Tambah Section di sini
        </button>
      )}
    </div>
  )
}
