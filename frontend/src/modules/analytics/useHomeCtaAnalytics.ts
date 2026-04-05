import { useCallback } from 'react'
import { trackEvent } from '@/modules/analytics'

type HomeCtaKind = 'request' | 'contact' | 'store' | 'fanclub' | 'works'

export function useHomeCtaAnalytics(section: string) {
  return useCallback((kind: HomeCtaKind) => {
    trackEvent('home_cta_click', {
      cta_kind: kind,
      section,
    })
  }, [section])
}
