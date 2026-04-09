import type { SiteSettings } from '@/types'
import type { SeasonalThemeKey, SeasonalThemeResolution, SeasonalSite } from '@/modules/seasonal/types'

const VALID_THEMES: SeasonalThemeKey[] = ['default', 'christmas', 'halloween', 'newyear']

function parseTheme(value: unknown): SeasonalThemeKey | null {
  return typeof value === 'string' && VALID_THEMES.includes(value as SeasonalThemeKey)
    ? (value as SeasonalThemeKey)
    : null
}

function toDate(input?: string | null): Date | null {
  if (!input) return null
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

function isInRange(now: Date, start?: string | null, end?: string | null): boolean {
  const s = toDate(start)
  const e = toDate(end)
  if (s && now < s) return false
  if (e && now > e) return false
  return true
}

function dateBasedTheme(now: Date): SeasonalThemeKey {
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()
  if (month === 12 && day >= 1) return 'christmas'
  if (month === 10 && day >= 1) return 'halloween'
  if (month === 1 && day <= 15) return 'newyear'
  return 'default'
}

function parseAppliedSites(value: unknown): SeasonalSite[] {
  if (Array.isArray(value)) {
    const filtered = value.filter((v): v is SeasonalSite => v === 'store' || v === 'fanclub' || v === 'main')
    if (filtered.length > 0) return filtered
  }
  return ['store', 'fanclub', 'main']
}

export function resolveSeasonalTheme(settings?: SiteSettings | null, site: SeasonalSite = 'store', now = new Date(), previewTheme?: SeasonalThemeKey | null): SeasonalThemeResolution {
  const manualThemeOverride = parseTheme(settings?.manualThemeOverride)
  const scheduledTheme = parseTheme(settings?.seasonalTheme)
  const autoThemeEnabled = settings?.autoThemeEnabled !== false
  const appliedTo = parseAppliedSites(settings?.themeAppliedSites)

  if (previewTheme && appliedTo.includes(site)) {
    return {
      theme: previewTheme,
      source: 'manual_override',
      autoThemeEnabled,
      manualThemeOverride,
      appliedTo,
      newyearIntroEnabled: settings?.newyearIntroEnabled !== false,
      omikujiEnabled: settings?.omikujiEnabled !== false,
      firstVisitOnlyEnabled: settings?.firstVisitOnlyEnabled !== false,
    }
  }

  if (manualThemeOverride && appliedTo.includes(site)) {
    return {
      theme: manualThemeOverride,
      source: 'manual_override',
      autoThemeEnabled,
      manualThemeOverride,
      appliedTo,
      newyearIntroEnabled: settings?.newyearIntroEnabled !== false,
      omikujiEnabled: settings?.omikujiEnabled !== false,
      firstVisitOnlyEnabled: settings?.firstVisitOnlyEnabled !== false,
    }
  }

  if (scheduledTheme && isInRange(now, settings?.seasonalStartAt, settings?.seasonalEndAt) && appliedTo.includes(site)) {
    return {
      theme: scheduledTheme,
      source: 'scheduled_event',
      autoThemeEnabled,
      manualThemeOverride,
      appliedTo,
      newyearIntroEnabled: settings?.newyearIntroEnabled !== false,
      omikujiEnabled: settings?.omikujiEnabled !== false,
      firstVisitOnlyEnabled: settings?.firstVisitOnlyEnabled !== false,
    }
  }

  if (autoThemeEnabled && appliedTo.includes(site)) {
    return {
      theme: dateBasedTheme(now),
      source: 'date_auto',
      autoThemeEnabled,
      manualThemeOverride,
      appliedTo,
      newyearIntroEnabled: settings?.newyearIntroEnabled !== false,
      omikujiEnabled: settings?.omikujiEnabled !== false,
      firstVisitOnlyEnabled: settings?.firstVisitOnlyEnabled !== false,
    }
  }

  return {
    theme: 'default',
    source: 'default',
    autoThemeEnabled,
    manualThemeOverride,
    appliedTo,
    newyearIntroEnabled: settings?.newyearIntroEnabled !== false,
    omikujiEnabled: settings?.omikujiEnabled !== false,
    firstVisitOnlyEnabled: settings?.firstVisitOnlyEnabled !== false,
  }
}
