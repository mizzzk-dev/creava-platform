import { useState } from 'react'

interface SiteLogoProps {
  className?: string
}

export default function SiteLogo({ className = '' }: SiteLogoProps) {
  const [svgFailed, setSvgFailed] = useState(false)

  if (svgFailed) {
    return (
      <span className={`flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>
        <span className="font-mono text-[10px] font-medium text-gray-300 dark:text-gray-600 select-none">&gt;_</span>
        Creava
      </span>
    )
  }

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.svg"
        alt="Creava"
        width={24}
        height={24}
        onError={() => setSvgFailed(true)}
        className="shrink-0"
      />
      <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        Creava
      </span>
    </span>
  )
}
