import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/design-system/classNames'
import { useMagneticHover } from '@/hooks/useMagneticHover'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'cyber' | 'cyber-outline' | 'cyber-amber'
type ButtonSize = 'sm' | 'md' | 'lg'

interface SharedProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
  children: ReactNode
  /** Enable magnetic hover effect. Default: false */
  magnetic?: boolean
}

type NativeButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & {
  to?: never
  href?: never
}

type LinkButtonProps = SharedProps & {
  to: string
  href?: never
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

type ExternalLinkButtonProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  to?: never
}

type Props = NativeButtonProps | LinkButtonProps | ExternalLinkButtonProps

const variantClassMap: Record<ButtonVariant, string> = {
  /* ── Legacy ─────────────────────────────────── */
  primary:
    'border border-transparent bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300',
  secondary:
    'border border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900 dark:border-[rgba(120,130,200,0.2)] dark:bg-[rgba(16,16,31,0.6)] dark:text-gray-200 dark:hover:border-cyan-500/30 dark:hover:text-gray-100',
  ghost:
    'border border-transparent bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[rgba(6,182,212,0.05)] dark:hover:text-gray-100',
  accent:
    'border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800/60 dark:bg-[rgba(139,92,246,0.08)] dark:text-violet-300 dark:hover:bg-[rgba(139,92,246,0.15)]',

  /* ── Cyber new ──────────────────────────────── */
  cyber:
    'border border-transparent bg-neon-cyan text-cyber-950 font-medium tracking-wide hover:bg-[#0891b2] hover:shadow-[0_0_24px_rgba(6,182,212,0.4),0_0_48px_rgba(6,182,212,0.15)] transition-shadow',
  'cyber-outline':
    'border border-[rgba(6,182,212,0.35)] bg-[rgba(6,182,212,0.04)] text-neon-cyan tracking-wide hover:border-[rgba(6,182,212,0.6)] hover:bg-[rgba(6,182,212,0.08)] hover:shadow-[0_0_16px_rgba(6,182,212,0.2)]',
  'cyber-amber':
    'border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.04)] text-neon-amber tracking-wide hover:border-[rgba(245,158,11,0.6)] hover:bg-[rgba(245,158,11,0.08)] hover:shadow-[0_0_16px_rgba(245,158,11,0.2)]',
}

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-xs',
  md: 'h-10 px-4   text-sm',
  lg: 'h-11 px-5   text-sm',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  className,
  fullWidth,
  magnetic = false,
  children,
  ...props
}: Props) {
  const mag = useMagneticHover<HTMLElement>({ strength: 0.3, scale: 1.03 })

  const isCyber = variant.startsWith('cyber')

  const classes = cn(
    'focus-ring inline-flex items-center justify-center font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60',
    /* Shape: cyber variants are sharp, others rounded */
    isCyber ? 'rounded-none' : 'rounded-full',
    /* Non-magnetic default lift */
    !magnetic && 'hover:-translate-y-0.5',
    /* Variant */
    variantClassMap[variant],
    /* Size */
    sizeClassMap[size],
    fullWidth && 'w-full',
    className,
  )

  const magneticProps = magnetic
    ? { ref: mag.ref as React.RefObject<never>, onMouseMove: mag.onMouseMove, onMouseLeave: mag.onMouseLeave }
    : {}

  if ('to' in props && props.to) {
    const { to, ...rest } = props
    return (
      <Link to={to} className={classes} {...(magneticProps as object)} {...rest}>
        {children}
      </Link>
    )
  }

  if ('href' in props && props.href) {
    const { href, ...rest } = props
    return (
      <a href={href} className={classes} {...(magneticProps as object)} {...rest}>
        {children}
      </a>
    )
  }

  const buttonProps = props as NativeButtonProps
  const { magnetic: _m, ...cleanButtonProps } = buttonProps as NativeButtonProps & { magnetic?: boolean }
  return (
    <button
      type={cleanButtonProps.type ?? 'button'}
      className={classes}
      {...(magneticProps as object)}
      {...cleanButtonProps}
    >
      {children}
    </button>
  )
}
