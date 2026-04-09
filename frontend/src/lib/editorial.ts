export interface PublicationWindow {
  startAt?: string | null
  endAt?: string | null
}

export interface TopPageSectionConfig extends PublicationWindow {
  key: string
  enabled?: boolean
  priority?: number
  site?: 'store' | 'fanclub' | 'all'
  locale?: string
}

const DEFAULT_PRIORITY = 0

function toDate(value?: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isWithinPublicationWindow(window: PublicationWindow, now = new Date()): boolean {
  const start = toDate(window.startAt)
  const end = toDate(window.endAt)

  if (start && start.getTime() > now.getTime()) return false
  if (end && end.getTime() < now.getTime()) return false
  return true
}

export function sortByPriorityDesc<T extends { priority?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.priority ?? DEFAULT_PRIORITY) - (a.priority ?? DEFAULT_PRIORITY))
}

export function parseTopPageSections(raw: unknown): TopPageSectionConfig[] {
  if (!Array.isArray(raw)) return []

  const parsed: TopPageSectionConfig[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (typeof row.key !== 'string' || !row.key.trim()) continue

    parsed.push({
      key: row.key.trim(),
      enabled: row.enabled !== false,
      priority: typeof row.priority === 'number' ? row.priority : DEFAULT_PRIORITY,
      site: row.site === 'store' || row.site === 'fanclub' || row.site === 'all' ? row.site : 'all',
      locale: typeof row.locale === 'string' ? row.locale : undefined,
      startAt: typeof row.startAt === 'string' ? row.startAt : null,
      endAt: typeof row.endAt === 'string' ? row.endAt : null,
    })
  }

  return parsed
}


export function createSectionVisibilityResolver(
  sections: TopPageSectionConfig[],
  site: 'store' | 'fanclub',
  locale?: string,
) {
  const activeKeys = new Set(
    sections
      .filter((section) => section.enabled !== false)
      .filter((section) => section.site === 'all' || section.site === site)
      .filter((section) => !section.locale || !locale || section.locale === locale)
      .filter((section) => isWithinPublicationWindow(section))
      .map((section) => section.key),
  )

  return (key: string, fallback = true): boolean => {
    if (activeKeys.size === 0) return fallback
    return activeKeys.has(key)
  }
}
