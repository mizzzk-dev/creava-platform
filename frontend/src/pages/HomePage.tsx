import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import HeroSection from '@/modules/home/components/HeroSection'
import AboutTeaserSection from '@/modules/home/components/AboutTeaserSection'
import LatestSection from '@/modules/home/components/LatestSection'
import FeaturedWorksSection from '@/modules/home/components/FeaturedWorksSection'
import StorePreviewSection from '@/modules/home/components/StorePreviewSection'
import FanclubCTASection from '@/modules/home/components/FanclubCTASection'

export default function HomePage() {
  const { t } = useTranslation()
  return (
    <div>
      <PageHead description={t('seo.home')} />
      {/* 1. Hero — first impression + CTA */}
      <HeroSection />
      {/* 2. About teaser — who is this person */}
      <AboutTeaserSection />
      {/* 3. Latest — news/blog/events feed */}
      <LatestSection />
      {/* 4. Featured Works — portfolio showcase */}
      <FeaturedWorksSection />
      {/* 5. Store Preview — merchandise */}
      <StorePreviewSection />
      {/* 6. Fanclub CTA — membership conversion */}
      <FanclubCTASection />
    </div>
  )
}
