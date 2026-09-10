import SectionLabel from './ui/SectionLabel'
import SectionBox from './ui/SectionBox'
import Button from './ui/Button'
import InlineText from './edit/InlineText'
import ContactForm from './ContactForm'
import { useEditMode } from '../context/EditModeContext'
import { useLanguage } from '../context/LanguageContext'
import { t, ui } from '../lib/i18n'
import { updateProfile } from '../lib/mutations'
import type { Profile } from '../types'

type ContactProps = {
  profile: Profile | null
}

const socialLinks: Array<{ key: keyof Profile; label: string }> = [
  { key: 'github_url', label: 'GitHub' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'linkedin_url', label: 'LinkedIn' },
  { key: 'twitter_url', label: 'Twitter' },
]

export default function Contact({ profile }: ContactProps) {
  const { enabled } = useEditMode()
  const { lang } = useLanguage()
  const links = socialLinks.filter(({ key }) => profile?.[key])

  return (
    <SectionBox id="contact" className="isolate">
      {/* Glow aksen sangat halus di bawah tengah (dekorasi TAHAP 2) */}
      <div
        aria-hidden
        className="bg-glow-accent pointer-events-none absolute bottom-0 left-1/2 -z-10 h-80 w-[44rem] max-w-full -translate-x-1/2 select-none opacity-70"
      />
      <SectionLabel index="04">Contact</SectionLabel>

      <h2 className="section-title-text mt-14 font-extrabold leading-[1.05] tracking-tight">
        {t(ui.mariTerhubung, lang)}<span className="text-accent">.</span>
      </h2>

      <p className="body-text mt-6 max-w-xl leading-relaxed text-muted">
        {t(ui.contactDesc, lang)}
      </p>

      {!enabled ? (
        /* ---------- Tampilan pengunjung ---------- */
        <>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            {profile?.email && (
              <Button href={`mailto:${profile.email}`} variant="ghost">
                <span className="font-mono text-xs text-accent">✉</span>
                {profile.email}
              </Button>
            )}

            {links.map(({ key, label }) => (
              <a
                key={key}
                href={profile?.[key] as string}
                target="_blank"
                rel="noreferrer"
                className="cursor-target text-sm text-muted transition-colors:hover:text-foreground"
              >
                {label}
                <span className="ml-1 text-accent">↗</span>
              </a>
            ))}
          </div>

          {!profile?.email && links.length === 0 && (
            <p className="mt-8 rounded-lg border border-hairline bg-surface p-6 text-sm text-muted">
              Email & link sosmed belum diisi. Admin bisa mengisinya lewat Mode
              Edit di pojok kanan bawah.
            </p>
          )}

          {/* Form kontak langsung — alternatif selain email/sosmed */}
          <ContactForm />
        </>
      ) : (
        /* ---------- Mode Edit: isi email & link langsung ---------- */
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface px-3 py-2">
            <span className="w-24 shrink-0 font-mono text-xs text-accent">
              Email
            </span>
            <InlineText
              className="min-w-0 flex-1 font-mono text-sm text-foreground"
              value={profile?.email ?? ''}
              placeholder="kamu@email.com"
              ariaLabel="Edit email kontak"
              onSave={async (v) => {
                await updateProfile({ email: v.trim() })
              }}
            />
          </div>

          {socialLinks.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg border border-hairline bg-surface px-3 py-2"
            >
              <span className="w-24 shrink-0 font-mono text-xs text-muted">
                {label}
              </span>
              <InlineText
                className="min-w-0 flex-1 font-mono text-sm text-muted"
                value={profile?.[key] as string}
                placeholder={`https://… (kosong = disembunyikan)`}
                ariaLabel={`Edit link ${label}`}
                onSave={async (v) => {
                  await updateProfile({ [key]: v.trim() } as Partial<Profile>)
                }}
              />
            </div>
          ))}
          <p className="pt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
            Link yang dikosongkan otomatis tidak tampil untuk pengunjung
          </p>
        </div>
      )}
    </SectionBox>
  )
}