import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import HeroSection from '@/modules/home/components/HeroSection'
import AboutTeaserSection from '@/modules/home/components/AboutTeaserSection'
import LatestSection from '@/modules/home/components/LatestSection'
import FeaturedWorksSection from '@/modules/home/components/FeaturedWorksSection'
import PricingTeaserSection from '@/modules/home/components/PricingTeaserSection'
import StorePreviewSection from '@/modules/home/components/StorePreviewSection'
import ContactCTASection from '@/modules/home/components/ContactCTASection'
import FanclubCTASection from '@/modules/home/components/FanclubCTASection'
import GitHubTrustSection from '@/modules/home/components/GitHubTrustSection'
import CaseStudyTeaserSection from '@/modules/home/components/CaseStudyTeaserSection'
import { SITE_URL, SITE_NAME } from '@/lib/seo'

export default function HomePage() {
  const { t } = useTranslation()
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
      <FeaturedWorksSection />
      <CaseStudyTeaserSection />
      <PricingTeaserSection />
      <StorePreviewSection />
      <ContactCTASection />
      <FanclubCTASection />
    </div>
  )
}
