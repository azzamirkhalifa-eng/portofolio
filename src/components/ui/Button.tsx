import { Link } from 'react-router-dom'
import type {
  ButtonHTMLAttributes,
  MouseEventHandler,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react'
import SpecularButton from '../fx/SpecularButton'

type ButtonProps = {
  /** 'primary' = specular dengan tint aksen, 'ghost' = specular polos. */
  variant?: 'primary' | 'ghost'
  className?: string
  children: ReactNode
  /** Kalau diisi, dirender sebagai <Link> (navigasi SPA antar halaman). */
  to?: string
  /** Kalau diisi, dirender sebagai <a> (link eksternal). */
  href?: string
  /** Untuk <a> eksternal: '_blank' membuka di tab baru (sertakan rel). */
  target?: string
  rel?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'target' | 'rel'>

/** Tampilan SpecularButton: rim-light WebGL mengikuti kursor. */
const SPECULAR_PROPS = {
  size: 'md' as const,
  radius: 12,
  blur: 0,
  textColor: '#f2f5fa',
  lineColor: '#ffffff',
  // Border tombol = biru-abu senada palet slate (setara surface-3 yang
  // diterangkan), jadi outline menyatu dengan tema; rim-light hover
  // (lineColor putih, followMouse) memberi respons hover yang kuat.
  baseColor: '#4a5c7e',
  intensity: 1,
  shineSize: 10,
  shineFade: 40,
  thickness: 1,
  speed: 0.35,
  followMouse: true,
  proximity: 250,
  autoAnimate: false,
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  to,
  href,
  target,
  rel,
  disabled,
  onClick,
  type = 'button',
}: ButtonProps) {
  const cls = `cursor-target ${className}`.trim()

  // Saat dibungkus <Link>/<a>, klik ditangani wrapper-nya — onClick di
  // <button> dalam TIDAK dipasang supaya handler tidak terpanggil dua kali
  // (klik pada child di dalam anchor tetap men-trigger navigasi wrapper).
  const specular = (withClick: boolean) => (
    <SpecularButton
      {...SPECULAR_PROPS}
      tint={variant === 'primary' ? '#3b82f6' : '#ffffff'}
      tintOpacity={variant === 'primary' ? 0.12 : 0}
      disabled={disabled}
      onClick={
        withClick
          ? (onClick as MouseEventHandler<HTMLButtonElement> | undefined)
          : undefined
      }
      type={type}
      className={cls}
    >
      {/* SpecularButton.jsx tak bertipe (children ter-infer string) —
          cast agar ReactNode apa pun bisa diteruskan. */}
      {children as unknown as string}
    </SpecularButton>
  )

  if (to) {
    return (
      <Link
        to={to}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault()
            return
          }
          onClick?.(e as unknown as ReactMouseEvent<HTMLButtonElement>)
        }}
        className={disabled ? 'pointer-events-none' : undefined}
        aria-disabled={disabled || undefined}
      >
        {specular(false)}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault()
            return
          }
          onClick?.(e as unknown as ReactMouseEvent<HTMLButtonElement>)
        }}
        className={disabled ? 'pointer-events-none' : undefined}
        aria-disabled={disabled || undefined}
      >
        {specular(false)}
      </a>
    )
  }

  return specular(true)
}
