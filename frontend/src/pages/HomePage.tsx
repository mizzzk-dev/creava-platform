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
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'

export default function HomePage() {
  const { t } = useTranslation()
  return (
    <div>
      <PageHead description={t('seo.home')} />

      {/* WebSite 構造化データ */}
      <StructuredData
        schema={{ type: 'WebSite', name: SITE_NAME, url: SITE_URL, description: t('seo.home') }}
      />
      {/* サイト運営者 Person スキーマ */}
      <StructuredData
        schema={{
          type: 'Person',
          name: SITE_NAME,
          url: `${SITE_URL}${ROUTES.ABOUT}`,
          description: t('seo.about'),
        }}
      />

      {/* 1. Hero — first impression + CTA */}
      <HeroSection />
      {/* 2. About teaser — who is this person */}
      <AboutTeaserSection />
      {/* 3. Latest — news/blog/events feed */}
      <LatestSection />
      {/* 4. Featured Works — portfolio showcase */}
      <FeaturedWorksSection />
      {/* 5. Pricing teaser — trust + lead */}
      <PricingTeaserSection />
      {/* 6. Store Preview — merchandise */}
      <StorePreviewSection />
      {/* 7. Contact CTA — lead conversion */}
      <ContactCTASection />
      {/* 8. Fanclub CTA — membership conversion */}
      <FanclubCTASection />
    </div>
  )
}
