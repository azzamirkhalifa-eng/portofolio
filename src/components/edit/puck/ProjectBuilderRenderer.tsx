import { useMemo } from 'react'
import { Render } from '@puckeditor/core'
import { builderConfig } from './builderConfig'
import type { BuilderDoc } from '../../../types/builder'

/**
 * Renderer publik dokumen builder (tanpa editor).
 *
 * WAJIB memo config & data: kontrak `Render` Puck — config/data yang
 * baru di tiap render me-reset internal state-nya. `config` konstanta
 * (modul-level) dan `data` di-memo per doc, jadi re-render halaman
 * (mis. refresh realtime useProjects) tidak mengganggu apapun.
 *
 * Canvas editor memakai komponen yang sama (builderConfig) — renderer
 * publik = renderer editor, tidak ada dua implementasi yang bisa beda.
 */
export default function ProjectBuilderRenderer({ doc }: { doc: BuilderDoc }) {
  const config = useMemo(() => builderConfig, [])
  const data = useMemo(
    () => ({
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
    }),
    [doc],
  )

  return <Render config={config} data={data} />
}
