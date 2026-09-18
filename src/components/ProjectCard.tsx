import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from './ui/Badge'
import GlareHover from './fx/GlareHover'
import SmoothImage from './ui/SmoothImage'
import InlineText from './edit/InlineText'
import InlineImage from './edit/InlineImage'
import {
  ButtonsEditorBilingual,
  GalleryEditor,
  SpecsEditorBilingual,
} from './edit/DetailEditors'
import { MiniBtn, selectCls } from './edit/controls'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import InlineTextBilingual from './edit/InlineTextBilingual'
import { pick, t, ui } from '../lib/i18n'
import { slugify } from '../lib/slug'
import { updateProject } from '../lib/mutations'
import type { Category, Project } from '../types'

type ProjectCardProps = {
  project: Project
  categories: Category[]
  canUp: boolean
  canDown: boolean
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
  /** Buka panel detail otomatis saat pertama dirender (project baru). */
  initiallyOpenDetail?: boolean
}

function RowLabel({ children }: { children: string }) {
  return (
    <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
      {children}
    </span>
  )
}

/** Tags sesuai bahasa aktif — pasangan per posisi, kosong = fallback ID. */
function pickTags(
  tags: string[],
  tagsEn: string[] | null | undefined,
  lang: 'id' | 'en',
): string[] {
  if (lang !== 'en' || !tagsEn || tagsEn.length === 0) return tags
  return tags.map((tag, i) => tagsEn[i]?.trim() || tag)
}

export default function ProjectCard({
  project,
  categories,
  canUp,
  canDown,
  onMove,
  onDelete,
  initiallyOpenDetail = false,
}: ProjectCardProps) {
  const { enabled, toast } = useEditMode()
  const { lang } = useLanguage()
  const [detailOpen, setDetailOpen] = useState(initiallyOpenDetail)

  const hasImage = Boolean(project.image_url)
  /** Thumbnail beranda: khusus kalau admin isi, else fallback gambar utama. */
  const thumbUrl = project.thumbnail_url || project.image_url
  const hasThumb = Boolean(thumbUrl)
  /** Tombol aksi yang layak tampil sebagai chip di kartu (ada label/url). */
  const buttonsPreview = (project.buttons ?? []).filter(
    (b) => b.label || b.url,
  )
  const detailTo = project.slug ? `/projects/${project.slug}` : null

  /** Simpan kolom project — error dibiarkan naik ke pemanggil. */
  async function saveField(patch: Parameters<typeof updateProject>[1]) {
    await updateProject(project.id, patch)
  }

  function toastErr(err: unknown, prefix: string) {
    toast(
      'error',
      `${prefix}: ${err instanceof Error ? err.message : 'terjadi kesalahan.'}`,
    )
  }

  // ---------------- Mode tampil (pengunjung) ----------------
  if (!enabled) {
    const cardBody = (
      <>
        <div className="relative aspect-video overflow-hidden border-b border-hairline bg-surface-2">
          {hasThumb ? (
            <SmoothImage
              src={thumbUrl}
              alt={`Preview ${project.title}`}
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement
                el.style.opacity = '0.4'
                el.alt = 'Gambar tidak dapat dimuat'
              }}
              className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-sm uppercase tracking-[0.3em] text-white/15">
              No Preview
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="project-card-title font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent">
            {pick(project.title, project.title_en, lang)}
          </h3>
          <p className="project-card-text mt-2 line-clamp-3 leading-relaxed text-muted">
            {pick(project.description, project.description_en, lang)}
          </p>
          {project.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {pickTags(project.tags, project.tags_en, lang).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
          {buttonsPreview.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {buttonsPreview.map((btn) => (
                <span
                  key={btn.id ?? `${btn.label}-${btn.url}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-xs font-medium text-muted"
                >
                  {pick(btn.label, btn.label_en, lang) || 'Link'}
                  {btn.url ? (
                    <span className="text-accent">↗</span>
                  ) : (
                    <span className="text-white/30">{t(ui.tanpaLink, lang)}</span>
                  )}
                </span>
              ))}
            </div>
          )}
          {detailTo && (
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-accent transition-colors group-hover:text-accent-hover">
              {t(ui.lihatDetail, lang)}
              <span aria-hidden>→</span>
            </span>
          )}
        </div>
      </>
    )

  return (
      <GlareHover
        glareColor="#3b82f6"
        glareOpacity={0.18}
        glareAngle={-30}
        glareSize={250}
        transitionDuration={900}
        playOnce
        className="gh-card"
      >
        <article className="cursor-target group flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.7)]">
          {detailTo ? (
            <Link
              to={detailTo}
              className="cursor-target flex flex-1 flex-col focus-visible:outline-none"
              aria-label={`Lihat detail project ${project.title}`}
            >
              {cardBody}
            </Link>
          ) : (
            <div className="flex flex-1 flex-col">{cardBody}</div>
          )}
        </article>
      </GlareHover>
      )
  }

  // ---------------- Mode Edit (admin) ----------------
  const slugAuto = !project.slug || project.slug.startsWith('project-')

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-accent/25 bg-surface transition-colors">
      {/* Gambar — klik untuk upload. Panel detail punya pilihan
          upload thumbnail khusus beranda (opsional). */}
      <div className="relative aspect-video overflow-hidden border-b border-hairline bg-surface-2">
        <InlineImage
          src={project.image_url}
          alt={`Preview ${project.title}`}
          folder="projects"
          uploadLabel="Ganti Gambar"
          shapeClass="rounded-none"
          cropContext="project-thumbnail"
          cropTitle="Gambar Project"
          onSave={async (url) => {
            await saveField({ image_url: url })
          }}
        >
          {hasImage ? (
            <SmoothImage
              src={project.image_url}
              alt={`Preview ${project.title}`}
              sizes="(min-width:768px) 33vw, 100vw"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.4'
              }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/20">
              No Gambar
              <span className="text-[10px] normal-case tracking-normal text-accent">
                klik untuk upload
              </span>
            </div>
          )}
        </InlineImage>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          <InlineTextBilingual
            valueId={project.title}
            valueEn={project.title_en ?? ''}
            enabled={enabled}
            ariaLabel="Edit judul project"
            placeholder="Judul project…"
            placeholderEn="Project title…"
            onSaveId={async (v) => {
              const title = v.trim()
              // Slug dibuat otomatis dari judul (kalau belum ada slug kustom).
              const patch: Parameters<typeof updateProject>[1] = { title }
              if (slugAuto) {
                patch.slug = slugify(title) || project.slug
              }
              await saveField(patch)
            }}
            onSaveEn={async (v) => {
              await saveField({ title_en: v.trim() })
            }}
          />
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          <InlineTextBilingual
            valueId={project.description}
            valueEn={project.description_en ?? ''}
            enabled={enabled}
            multiline
            ariaLabel="Edit deskripsi singkat project"
            placeholder="Deskripsi singkat (tampil di kartu)…"
            placeholderEn="Short description (shown on the card)…"
            onSaveId={async (v) => {
              await saveField({ description: v })
            }}
            onSaveEn={async (v) => {
              await saveField({ description_en: v })
            }}
          />
        </p>

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-3">
          <MiniBtn title="Naikkan urutan" disabled={!canUp} onClick={() => onMove(-1)}>
            ↑
          </MiniBtn>
          <MiniBtn title="Turunkan urutan" disabled={!canDown} onClick={() => onMove(1)}>
            ↓
          </MiniBtn>
          <button
            type="button"
            onClick={() => setDetailOpen((v) => !v)}
            className={`ml-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
              detailOpen
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-hairline text-muted hover:border-white/25 hover:text-foreground'
            }`}
          >
            {detailOpen ? 'Tutup Detail' : 'Detail & Konten'}
          </button>
          <MiniBtn title="Hapus project" tone="danger" onClick={onDelete}>
            ✕
          </MiniBtn>
        </div>

        {/* Panel detail & konten lengkap */}
        {detailOpen && (
          <div className="mt-3 space-y-3 rounded-md border border-hairline bg-background/50 p-3">
            {/* Featured */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <RowLabel>Tampil di beranda</RowLabel>
                <p className="mt-0.5 text-[11px] text-white/30">
                  Dicentang = muncul di cuplikan halaman utama.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={project.featured}
                onClick={() =>
                  void saveField({ featured: !project.featured }).catch((err) =>
                    toastErr(err, 'Gagal mengubah tampilan di beranda'),
                  )
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  project.featured ? 'bg-accent' : 'bg-surface-2'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    project.featured ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Thumbnail beranda (opsional) */}
            <div>
              <RowLabel>Thumbnail beranda (opsional)</RowLabel>
              <p className="mt-0.5 text-[11px] text-white/30">
                Kalau kosong, beranda otomatis memakai gambar utama project.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {/* Preview DI DALAM InlineImage supaya area klik upload
                    berimpit dengan preview (pola sama seperti foto lain). */}
                <InlineImage
                  src={project.thumbnail_url ?? ''}
                  alt="Thumbnail beranda"
                  folder="projects"
                  uploadLabel="Upload Thumbnail"
                  shapeClass="rounded-md"
                  cropContext="project-thumbnail"
                  cropTitle="Thumbnail Beranda"
                  onSave={async (url) => {
                    await saveField({ thumbnail_url: url }).catch((err) =>
                      toastErr(err, 'Gagal menyimpan thumbnail'),
                    )
                  }}
                >
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt="Thumbnail beranda"
                      className="h-14 w-24 rounded-md border border-hairline object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-24 items-center justify-center rounded-md border border-hairline bg-surface-2 font-mono text-[10px] text-white/25">
                      Auto
                    </div>
                  )}
                </InlineImage>
                {project.thumbnail_url && (
                  <button
                    type="button"
                    onClick={() =>
                      void saveField({ thumbnail_url: '' }).catch((err) =>
                        toastErr(err, 'Gagal menghapus thumbnail'),
                      )
                    }
                    className="rounded-md border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:border-red-400/40 hover:text-red-400"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* Slug */}
            <div>
              <RowLabel>Alamat halaman detail</RowLabel>
              <p className="mt-1 truncate font-mono text-xs text-muted">
                /projects/{project.slug || '…'}
              </p>
              <p className="mt-0.5 text-[11px] text-white/30">
                Dibuat otomatis dari judul. Ganti judul saat slug masih otomatis
                untuk memperbaruinya.
              </p>
            </div>

            {/* Kategori */}
            <div>
              <RowLabel>Kategori</RowLabel>
              <select
                className={`${selectCls} mt-1 w-full`}
                value={project.category_id ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  void saveField({
                    category_id: val === '' ? null : Number(val),
                  }).catch((err) => toastErr(err, 'Gagal menyimpan kategori'))
                }}
              >
                <option value="">— Tanpa kategori —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Deskripsi lengkap */}
            <div>
              <RowLabel>Deskripsi lengkap (halaman detail)</RowLabel>
              <div className="mt-1 text-sm leading-relaxed text-muted">
                <InlineTextBilingual
                  valueId={project.full_description}
                  valueEn={project.full_description_en ?? ''}
                  enabled={enabled}
                  multiline
                  ariaLabel="Edit deskripsi lengkap project"
                  placeholder="Cerita lengkap project — latar belakang, fitur, proses…"
                  placeholderEn="Full project story — background, features, process…"
                  onSaveId={async (v) => {
                    await saveField({ full_description: v })
                  }}
                  onSaveEn={async (v) => {
                    await saveField({ full_description_en: v })
                  }}
                />
              </div>
            </div>

            {/* Galeri */}
            <div>
              <RowLabel>Galeri screenshot (halaman detail)</RowLabel>
              <div className="mt-1.5">
                <GalleryEditor
                  images={project.gallery}
                  cropContext="gallery"
                  cropTitle="Foto Galeri Project"
                  folder="projects"
                  onChange={async (next) => {
                    try {
                      await saveField({ gallery: next })
                    } catch (err) {
                      toastErr(err, 'Gagal menyimpan galeri')
                    }
                  }}
                />
              </div>
            </div>

            {/* Spesifikasi (dua bahasa) */}
            <div>
              <RowLabel>Spesifikasi (key-value bebas, ID + EN)</RowLabel>
              <div className="mt-1.5">
                <SpecsEditorBilingual
                  specs={project.specs}
                  specsEn={project.specs_en ?? {}}
                  onChange={async ({ specs, specsEn }) => {
                    try {
                      await saveField({ specs, specs_en: specsEn })
                    } catch (err) {
                      toastErr(err, 'Gagal menyimpan spesifikasi')
                    }
                  }}
                />
              </div>
            </div>

            {/* Tags (dua bahasa) */}
            <div>
              <RowLabel>Tags (pisahkan dengan koma)</RowLabel>
              <InlineText
                className="mt-1 block w-full font-mono text-xs text-muted"
                value={project.tags.join(', ')}
                placeholder="React, Vite, Supabase"
                ariaLabel="Edit tags project"
                onSave={async (v) => {
                  await saveField({
                    tags: v
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }}
              />
              <input
                className="mt-1.5 block w-full rounded-md border border-hairline bg-surface-3 px-2 py-1.5 font-mono text-xs text-muted outline-none transition-colors placeholder:text-white/45 focus:border-accent/60"
                value={(project.tags_en ?? []).join(', ')}
                placeholder="Tags (English) — kosong = pakai versi Indonesia"
                aria-label="Edit tags project (English)"
                onChange={(e) => {
                  const next = e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                  void saveField({ tags_en: next }).catch((err) =>
                    toastErr(err, 'Gagal menyimpan tags English'),
                  )
                }}
              />
            </div>

            {/* Tombol CTA utama (label + URL tujuan) */}
            <div>
              <RowLabel>Tombol CTA (di atas judul)</RowLabel>
              <div className="mt-1 space-y-1.5">
                <InlineTextBilingual
                  className="block w-full font-mono text-xs text-muted"
                  valueId={project.cta_label ?? ''}
                  valueEn={project.cta_label_en ?? ''}
                  enabled={enabled}
                  placeholder="Label, mis. Lihat Demo"
                  placeholderEn="Label, e.g. View Demo"
                  ariaLabel="Edit label tombol CTA"
                  onSaveId={async (v) => {
                    await saveField({ cta_label: v })
                  }}
                  onSaveEn={async (v) => {
                    await saveField({ cta_label_en: v })
                  }}
                />
                <InlineText
                  className="block w-full font-mono text-xs text-muted"
                  value={project.cta_url ?? ''}
                  placeholder="https://… (kosong = tombol disembunyikan)"
                  ariaLabel="Edit URL tujuan tombol CTA"
                  onSave={async (v) => {
                    await saveField({ cta_url: v.trim() })
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-white/30">
                Tombol utama di atas judul project. Kosongkan URL untuk
                menyembunyikannya — pengunjung dibuka ke tab baru kalau link
                eksternal.
              </p>
            </div>

            {/* Tombol aksi (dua bahasa) */}
            <div>
              <RowLabel>Tombol (atas halaman detail, ID + EN)</RowLabel>
              <div className="mt-1.5">
                <ButtonsEditorBilingual
                  buttons={project.buttons}
                  buttonsEn={project.buttons_en}
                  onChange={async ({ buttons, buttonsEn }) => {
                    try {
                      await saveField({ buttons, buttons_en: buttonsEn })
                    } catch (err) {
                      toastErr(err, 'Gagal menyimpan tombol')
                    }
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-white/30">
                Tiap tombol = label + URL tujuan (mis. "Live Demo"). Tombol
                pertama tampil solid, sisanya garis tepi. Kosongkan kolom
                yang tidak dipakai — otomatis disembunyikan untuk pengunjung.
              </p>
            </div>
            <p className="text-[11px] text-white/25">
              Deskripsi, galeri, tombol & spesifikasi yang kosong otomatis
              tidak tampil di halaman detail.
            </p>
          </div>
        )}
      </div>
    </article>
  )
}