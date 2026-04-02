type BadgeVariant = 'fc' | 'new' | 'featured' | 'archive' | 'limited' | 'soldout' | 'coming_soon'

interface Props {
  variant: BadgeVariant
  label?: string
  size?: 'xs' | 'sm'
}

const CONFIGS: Record<BadgeVariant, { defaultLabel: string; className: string; dot?: string }> = {
  fc: {
    defaultLabel: 'FC',
    className: 'border-violet-200 bg-violet-50 text-violet-600',
    dot: 'bg-violet-400',
  },
  new: {
    defaultLabel: 'NEW',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-400',
  },
  featured: {
    defaultLabel: 'FEATURED',
    className: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  archive: {
    defaultLabel: 'ARCHIVE',
    className: 'border-gray-200 bg-gray-50 text-gray-400',
  },
  limited: {
    defaultLabel: 'LIMITED',
    className: 'border-blue-200 bg-blue-50 text-blue-500',
    dot: 'bg-blue-400',
  },
  soldout: {
    defaultLabel: 'SOLD OUT',
    className: 'border-gray-200 bg-gray-50 text-gray-400',
  },
  coming_soon: {
    defaultLabel: 'SOON',
    className: 'border-dashed border-gray-200 bg-transparent text-gray-300',
  },
}

export default function Badge({ variant, label, size = 'xs' }: Props) {
  const config = CONFIGS[variant]
  const text = label ?? config.defaultLabel
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[10px]'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border font-mono uppercase tracking-wider ${sizeClass} ${config.className}`}
    >
      {config.dot && (
        <span className={`h-1 w-1 rounded-full ${config.dot}`} />
      )}
      {text}
    </span>
  )
}
