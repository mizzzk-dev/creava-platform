import HeroSection from '@/modules/home/components/HeroSection'
import LatestSection from '@/modules/home/components/LatestSection'
import FeaturedWorksSection from '@/modules/home/components/FeaturedWorksSection'
import StorePreviewSection from '@/modules/home/components/StorePreviewSection'
import MediaAwardsSection from '@/modules/home/components/MediaAwardsSection'
import FanclubCTASection from '@/modules/home/components/FanclubCTASection'

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <LatestSection />
      <FeaturedWorksSection />
      <StorePreviewSection />
      <MediaAwardsSection />
      <FanclubCTASection />
    </div>
  )
}
