import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import HeroSection from '@/modules/home/components/HeroSection'
import AboutTeaserSection from '@/modules/home/components/AboutTeaserSection'
import LatestSection from '@/modules/home/components/LatestSection'
import PersonalizedHubSection from '@/modules/home/components/PersonalizedHubSection'
import FeaturedWorksSection from '@/modules/home/components/FeaturedWorksSection'
import PricingTeaserSection from '@/modules/home/components/PricingTeaserSection'
import StorePreviewSection from '@/modules/home/components/StorePreviewSection'
import ContactCTASection from '@/modules/home/components/ContactCTASection'
import FanclubCTASection from '@/modules/home/components/FanclubCTASection'
import GitHubTrustSection from '@/modules/home/components/GitHubTrustSection'
import CaseStudyTeaserSection from '@/modules/home/components/CaseStudyTeaserSection'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import { getNewsList } from '@/modules/news/api'
import { getBlogList } from '@/modules/blog/api'
import { getEventsList } from '@/modules/events/api'
import { getProducts } from '@/modules/store/api'

export default function HomePage() {
  const { t } = useTranslation()

  useEffect(() => {
    const warmup = () => {
      void Promise.allSettled([
        getNewsList({ pagination: { pageSize: 4, withCount: false } }),
        getBlogList({ pagination: { pageSize: 4, withCount: false } }),
        getEventsList({ pagination: { pageSize: 4, withCount: false } }),
        getProducts({ pagination: { pageSize: 4, withCount: false } }),
      ])
    }

    if (typeof window === 'undefined') return
    const w = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, opts?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }

    if (typeof w.requestIdleCallback === 'function') {
      const idleId = w.requestIdleCallback(warmup, { timeout: 1500 })
      return () => w.cancelIdleCallback?.(idleId)
    }

    const timeoutId = window.setTimeout(warmup, 400)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <div>
      <PageHead description={t('seo.home')} />

      <StructuredData
        schema={{
          type: 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          description: t('seo.home'),
        }}
      />
      <StructuredData
        schema={{
          type: 'BreadcrumbList',
          items: [{ name: SITE_NAME, url: SITE_URL }],
        }}
      />

      <HeroSection />
      <AboutTeaserSection />
      <GitHubTrustSection />
      <LatestSection />
      <PersonalizedHubSection />
      <FeaturedWorksSection />
      <CaseStudyTeaserSection />
      <PricingTeaserSection />
      <StorePreviewSection />
      <ContactCTASection />
      <FanclubCTASection />
    </div>
  )
}
