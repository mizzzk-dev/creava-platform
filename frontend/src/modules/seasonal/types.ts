export type SeasonalThemeKey = 'default' | 'christmas' | 'halloween' | 'newyear'

export type SeasonalSite = 'store' | 'fanclub' | 'main'

export type SeasonalLoadingPreset = 'default' | 'christmas' | 'halloween' | 'newyear'
export type SeasonalScrollPreset = 'default' | 'soft' | 'dramatic'

export interface SeasonalThemeConfig {
  key: SeasonalThemeKey
  label: string
  heroVariant: 'default' | 'christmas' | 'halloween' | 'newyear'
  illustrationVariant: 'store' | 'fanclub' | 'limited' | 'support'
  backgroundVariant: 'store' | 'fanclub' | 'christmas' | 'halloween' | 'newyear'
  sectionStyleVariant: 'default' | 'festive' | 'spooky' | 'newyear'
  badgeVariant: 'default' | 'gift' | 'spooky' | 'celebrate'
  announcementVariant: 'default' | 'christmas' | 'halloween' | 'newyear'
  loadingPreset: SeasonalLoadingPreset
  scrollPreset: SeasonalScrollPreset
}

export interface SeasonalThemeResolution {
  theme: SeasonalThemeKey
  source: 'manual_override' | 'scheduled_event' | 'date_auto' | 'default'
  autoThemeEnabled: boolean
  manualThemeOverride: SeasonalThemeKey | null
  appliedTo: SeasonalSite[]
  newyearIntroEnabled: boolean
  omikujiEnabled: boolean
  firstVisitOnlyEnabled: boolean
}
