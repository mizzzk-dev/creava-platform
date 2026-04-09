import { createContext, useContext, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useStrapiSingle } from '@/hooks'
import { getSiteSettings } from '@/modules/settings/api'
import { resolveSeasonalTheme } from '@/modules/seasonal/resolver'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import { SEASONAL_THEME_REGISTRY } from '@/modules/seasonal/registry'
import type { SeasonalSite, SeasonalThemeConfig, SeasonalThemeResolution, SeasonalThemeKey } from '@/modules/seasonal/types'

interface SeasonalContextValue {
  resolution: SeasonalThemeResolution
  config: SeasonalThemeConfig
}

const SeasonalThemeContext = createContext<SeasonalContextValue>({
  resolution: {
    theme: 'default',
    source: 'default',
    autoThemeEnabled: true,
    manualThemeOverride: null,
    appliedTo: ['store', 'fanclub', 'main'],
    newyearIntroEnabled: true,
    omikujiEnabled: true,
    firstVisitOnlyEnabled: true,
  },
  config: SEASONAL_THEME_REGISTRY.default,
})

function parsePreviewTheme(search: string): SeasonalThemeKey | null {
  const params = new URLSearchParams(search)
  const value = params.get('seasonalThemePreview')
  if (value === 'default' || value === 'christmas' || value === 'halloween' || value === 'newyear') return value
  return null
}

export function SeasonalThemeProvider({ children, site }: { children: React.ReactNode; site: SeasonalSite }) {
  const { search } = useLocation()
  const previewTheme = parsePreviewTheme(search)
  const { item: settings } = useStrapiSingle(() => getSiteSettings({
    fields: [
      'seasonalTheme', 'themeMode', 'autoThemeEnabled', 'manualThemeOverride',
      'seasonalStartAt', 'seasonalEndAt', 'loadingAnimationVariant', 'scrollAnimationVariant',
      'sectionStyleVariant', 'seasonalBadgeVariant', 'seasonalBackgroundVariant',
      'newyearIntroEnabled', 'omikujiEnabled', 'firstVisitOnlyEnabled', 'themeAppliedSites',
    ],
  }))

  const resolution = useMemo(() => resolveSeasonalTheme(settings, site, new Date(), previewTheme), [settings, site, previewTheme])
  const config = SEASONAL_THEME_REGISTRY[resolution.theme]

  useEffect(() => {
    trackMizzzEvent('seasonal_theme_applied', { site, theme: resolution.theme, source: resolution.source })
  }, [resolution.source, resolution.theme, site])

  return (
    <SeasonalThemeContext.Provider value={{ resolution, config }}>
      <div data-seasonal-theme={resolution.theme} data-seasonal-source={resolution.source} className={`seasonal-theme seasonal-${resolution.theme}`}>
        {children}
      </div>
    </SeasonalThemeContext.Provider>
  )
}

export function useSeasonalTheme() {
  return useContext(SeasonalThemeContext)
}
