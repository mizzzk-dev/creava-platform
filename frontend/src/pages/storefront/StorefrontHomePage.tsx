import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useProductList } from '@/modules/store/hooks/useProductList'
import ProductCard from '@/modules/store/components/ProductCard'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import SeoInternalLinkSection from '@/components/common/SeoInternalLinkSection'
import { DEFAULT_COLLECTIONS, inferCollectionSlug } from '@/modules/store/lib/catalog'
import { useStrapiCollection, useStrapiSingle } from '@/hooks'
import { getNewsList } from '@/modules/news/api'
import { getFaqList } from '@/modules/faq/api'
import type { FAQItem, NewsItem } from '@/types'
import { trackApiFailure, trackCtaClick, trackEmptyState } from '@/modules/analytics/tracking'
import { fanclubLink } from '@/lib/siteLinks'
import { ROUTES } from '@/lib/routeConstants'
import UpdateDigestSection, { type UpdateDigestItem } from '@/components/common/UpdateDigestSection'
import EditorialSpotlightSection from '@/components/common/EditorialSpotlightSection'
import CampaignHero from '@/modules/campaign/components/CampaignHero'
import { getCampaignList } from '@/modules/campaign/api'
import { getSiteSettings } from '@/modules/settings/api'
import type { CampaignSummary } from '@/modules/campaign/types'
import { isCampaignActive } from '@/modules/campaign/lib'
import SectionReveal from '@/components/common/SectionReveal'
import CuratedBentoSection from '@/components/common/CuratedBentoSection'
import VisualHeroSection from '@/components/common/VisualHeroSection'
import ExperienceHighlightsSection from '@/components/common/ExperienceHighlightsSection'
import HeroImageSlider, { type HeroSlide } from '@/components/common/HeroImageSlider'
import ImageFeatureTile from '@/components/common/ImageFeatureTile'
import { buildStoreHeroFallbackSlides, normalizeHeroSlides } from '@/lib/heroSlides'
import { getMediaUrl } from '@/utils'
import { createSectionVisibilityResolver, parseTopPageSections } from '@/lib/editorial'
import { useSeasonalTheme } from '@/modules/seasonal/context'
import DailyMessageCard from '@/modules/playful/components/DailyMessageCard'
import WeeklyPickupCard from '@/modules/playful/components/WeeklyPickupCard'
import SurpriseCard from '@/modules/playful/components/SurpriseCard'
import HiddenQuote from '@/modules/playful/components/HiddenQuote'
import EasterEggTrigger from '@/modules/playful/components/EasterEggTrigger'

export default function StorefrontHomePage() {
  const { i18n, t } = useTranslation()
  const { resolution, config } = useSeasonalTheme()
  const { products, loading, error, refetch } = useProductList(24)
  const { item: settings } = useStrapiSingle(() => getSiteSettings({
    locale: i18n.resolvedLanguage,
  }))
  const { items: news, loading: newsLoading, error: newsError, refetch: refetchNews } = useStrapiCollection<NewsItem>(
    () => getNewsList({ pagination: { pageSize: 4, withCount: false } }),
  )
  const { items: faqs, loading: faqLoading, error: faqError, refetch: refetchFaq } = useStrapiCollection<FAQItem>(
    () => getFaqList({ pagination: { pageSize: 4, withCount: false } }),
  )
  const { items: campaigns } = useStrapiCollection<CampaignSummary>(() => getCampaignList())
  const sectionResolver = useMemo(() => createSectionVisibilityResolver(
    parseTopPageSections(settings?.topPageSections),
    'store',
    i18n.resolvedLanguage,
  ), [i18n.resolvedLanguage, settings?.topPageSections])


  const priorityProducts = useMemo(() => [...products].sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0)), [products])
  const newArrivals = useMemo(() => priorityProducts.slice(0, 8), [priorityProducts])
  const featured = useMemo(() => products.filter((product) => product.accessStatus !== 'fc_only').slice(0, 4), [products])
  const digitalGoods = useMemo(() => products.filter((product) => inferCollectionSlug(product) === 'digital').slice(0, 4), [products])
  const pickup = useMemo(() => products.filter((product) => product.purchaseStatus === 'available').slice(0, 2), [products])
  const memberPickup = useMemo(() => products.filter((product) => product.earlyAccess || product.accessStatus === 'fc_only' || product.memberBenefit).slice(0, 3), [products])
  const campaignItems = useMemo(
    () =>
      products
        .filter((product) => product.campaignLabel || product.isTrending || product.isLimited)
        .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))
        .slice(0, 3),
    [products],
  )
  const spotlightItems = useMemo(
    () =>
      campaignItems.map((item) => ({
        id: `spotlight-${item.id}`,
        eyebrow: item.campaignLabel ?? (item.isLimited ? 'LIMITED OFFER' : 'TREND EDIT'),
        title: item.title,
        description: item.heroCopy ?? item.shortHighlight ?? 'キャンペーン・限定販売・先行情報を商品詳細で確認できます。',
        href: `/products/${item.slug}`,
        ctaLabel: '詳細を見る',
        tone: (item.earlyAccess || item.accessStatus === 'fc_only' ? 'member' : item.campaignLabel ? 'campaign' : 'default') as 'default' | 'campaign' | 'member',
        trackingLocation: 'store_home_spotlight',
      })),
    [campaignItems],
  )
  const digestItems = useMemo<UpdateDigestItem[]>(() => {
    const next: UpdateDigestItem[] = []
    if (products[0]) {
      next.push({
        id: `product-${products[0].id}`,
        title: `新着: ${products[0].title}`,
        description: 'ストアの新着商品を今すぐチェック',
        href: `/products/${products[0].slug}`,
        tone: 'new',
        location: 'store_home_digest',
      })
    }
    if (memberPickup[0]) {
      next.push({
        id: `member-${memberPickup[0].id}`,
        title: `FC先行: ${memberPickup[0].title}`,
        description: memberPickup[0].specialOffer ?? memberPickup[0].memberBenefit ?? '会員向け販売情報を確認できます。',
        href: fanclubLink(ROUTES.FC_JOIN),
        tone: 'early',
        location: 'store_home_digest',
      })
    }
    next.push({
      id: 'support-faq-guide',
      title: '配送・返品・FAQをまとめて確認',
      description: '購入前後の不安をガイド導線で解消できます。',
      href: '/guide',
      tone: 'important',
      location: 'store_home_digest',
    })
    return next.slice(0, 3)
  }, [memberPickup, products])
  const curatedBentoItems = useMemo(
    () => [
      {
        id: 'store-weekly-update',
        title: '今週の更新を最短で確認',
        description: '新着・先行・重要導線をまとめた更新ダイジェストにすぐ移動できます。',
        href: '#store-weekly-update',
        label: 'WEEKLY UPDATE',
        accent: 'violet' as const,
        location: 'store_home_bento',
        action: 'weekly_update',
        className: 'sm:col-span-2 lg:col-span-3',
      },
      {
        id: 'store-pickup',
        title: 'ピックアップ特集',
        description: 'キャンペーン中の商品を編集視点でまとめた特集を表示。',
        href: '/products',
        label: 'CURATED PICKUP',
        accent: 'sky' as const,
        location: 'store_home_bento',
        action: 'pickup',
      },
      {
        id: 'store-member-line',
        title: 'FC先行・会員特典',
        description: '会員向け販売情報や先行案内を見逃さない導線設計。',
        href: fanclubLink(ROUTES.FC_JOIN),
        label: 'MEMBER BENEFIT',
        accent: 'fuchsia' as const,
        location: 'store_home_bento',
        action: 'member_benefit',
      },
      {
        id: 'store-guide',
        title: '購入ガイド / FAQ',
        description: '配送・返品・問い合わせ前の確認ポイントを一箇所に整理。',
        href: '/guide',
        label: 'SAFE PURCHASE',
        accent: 'amber' as const,
        location: 'store_home_bento',
        action: 'guide',
      },
    ],
    [],
  )
  const primaryCampaign = useMemo(
    () =>
      (campaigns ?? [])
        .filter((item) => isCampaignActive(item))
        .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))[0] ?? null,
    [campaigns],
  )
  const heroSlides: HeroSlide[] = useMemo(() => {
    const fromCms = normalizeHeroSlides((settings as unknown as { heroSlides?: unknown })?.heroSlides)
    if (fromCms.length) return fromCms
    return buildStoreHeroFallbackSlides(settings ?? null, {
      title: settings?.heroTitle?.trim() || t('seasonal.store.title', { defaultValue: '静けさの中で、' }),
      description:
        settings?.heroCopy?.trim() ||
        t('seasonal.store.description', { defaultValue: '新着・限定・デジタル商品をエディトリアルに整理。商品が少ない時も、多い時も、見つけやすく心地よいストア体験を保ちます。' }),
      ctaLabel: settings?.heroCTALabel?.trim() || '全商品を見る',
      ctaHref: settings?.heroCTAUrl?.trim() || '/products',
    })
  }, [settings, t])
  const pickupImageUrl = getMediaUrl(settings?.pickupImage ?? null, 'medium')
  const featuredImageUrl = getMediaUrl(settings?.featuredImage ?? null, 'medium')
  const campaignImageUrl = getMediaUrl(settings?.campaignImage ?? null, 'medium')
  const collectionHeroImages = (settings?.collectionHeroImages ?? [])
    .map((m) => getMediaUrl(m, 'medium'))
    .filter((u): u is string => Boolean(u))
  useEffect(() => {
    if (error) trackApiFailure('store_home_products', error)
  }, [error])
  useEffect(() => {
    if (!loading && !error && newArrivals.length === 0) trackEmptyState('store_home_new_arrival')
  }, [error, loading, newArrivals.length])

  return (
    <section className="ds-container py-8 sm:py-12">
      <PageHead title="mizzz Official Store" description="mizzz公式オンラインストア。新商品・デジタル商品・お知らせをまとめて確認できます。" />

      <StructuredData
        schema={{
          type: 'CollectionPage',
          name: 'mizzz official store',
          url: 'https://store.mizzz.jp/',
          description: '商品一覧、特集、FAQ、ガイドへのストアハブページ',
        }}
      />
      <StructuredData
        schema={{
          type: 'ItemList',
          name: 'store featured links',
          url: 'https://store.mizzz.jp/',
          items: [
            { position: 1, name: '全商品', url: 'https://store.mizzz.jp/products' },
            { position: 2, name: 'Guide', url: 'https://store.mizzz.jp/guide' },
            { position: 3, name: 'FAQ', url: 'https://store.mizzz.jp/faq' },
            { position: 4, name: 'News', url: 'https://store.mizzz.jp/news' },
          ],
        }}
      />

      {/* ビジュアル主役のヒーロー — CMS heroSlides で差し替え可能、未設定時はフォールバック */}
      <HeroImageSlider
        slides={heroSlides}
        aspectRatio="16/9"
        mobileAspectRatio="4/5"
        locationTag="store_home_hero_slider"
        onCtaClick={(slideIndex, kind) =>
          trackCtaClick('store_home_hero_slider', `${kind}_slide_${slideIndex}`, {
            slide: String(heroSlides[slideIndex]?.id ?? slideIndex),
          })
        }
      />

      {/* コピー + アクション — 画像の下にエディトリアルに配置 */}
      <VisualHeroSection
        location="store_home_hero"
        eyebrow="mizzz official store"
        badge={settings?.announcementText?.trim() || t('seasonal.heroBadgeDefault', { defaultValue: 'featured / pickup / weekly update' })}
        title={settings?.heroTitle?.trim() || t('seasonal.store.title', { defaultValue: '静けさの中で、' })}
        subtitle={settings?.heroSubtitle?.trim() || t('seasonal.store.subtitle', { defaultValue: '欲しいものに迷わず届く。' })}
        description={settings?.heroCopy?.trim() || t('seasonal.store.description', { defaultValue: '新着・限定・デジタル商品をエディトリアルに整理。商品が少ない時も、多い時も、見つけやすく心地よいストア体験を保ちます。' })}
        seasonalTitle={t(`seasonal.theme.${resolution.theme}`)}
        illustrationVariant={config.illustrationVariant}
        backgroundVariant="store"
        actions={[
          { label: settings?.heroCTALabel?.trim() || '全商品を見る', to: settings?.heroCTAUrl?.trim() || '/products', cta: 'all_products', style: 'primary' },
          { label: 'Digital Goods', to: '/collections/digital', cta: 'digital_collection', style: 'secondary' },
          { label: 'FC先行案内を見る', to: fanclubLink(ROUTES.FC_JOIN), cta: 'to_fanclub_join', style: 'accent' },
          { label: 'Guide', to: '/guide', cta: 'guide', style: 'secondary' },
        ]}
        metrics={[
          { label: 'This week', value: '新着ドロップと限定販売の更新を毎週整理して掲載。' },
          { label: '今週の更新', value: 'weekly update を先頭導線で常設。' },
          { label: 'キャンペーン', value: 'limited / trending をカードで再編集。' },
          { label: '会員導線', value: 'FC先行や特典導線を常時表示。' },
          { label: 'ガイド', value: 'FAQ / 配送 / 返品導線を固定配置。' },
        ]}
      />


      <ExperienceHighlightsSection
        site="store"
        title={t('experience.store.title', { defaultValue: '売り場感と安心感を両立するストア体験' })}
        description={t('experience.store.description', { defaultValue: '商品が少ない時でも価値が伝わるように、特集・ガイド・会員導線を組み合わせた編集構成に刷新しました。' })}
        highlights={[
          {
            id: 'store-highlight-1',
            title: t('experience.store.highlightSalesTitle', { defaultValue: '特集・新着・限定を先頭で可視化' }),
            description: t('experience.store.highlightSalesDesc', { defaultValue: 'ピックアップやキャンペーン導線を固定し、購入判断までの迷いを短縮。' }),
          },
          {
            id: 'store-highlight-2',
            title: t('experience.store.highlightGuideTitle', { defaultValue: '購入前の不安をガイド導線で解消' }),
            description: t('experience.store.highlightGuideDesc', { defaultValue: '配送・返品・FAQ・問い合わせをワンフローで確認できます。' }),
          },
          {
            id: 'store-highlight-3',
            title: t('experience.store.highlightMemberTitle', { defaultValue: 'FC特典への自然なブリッジ' }),
            description: t('experience.store.highlightMemberDesc', { defaultValue: '先行販売や会員特典にすぐ遷移できる横断CTAを追加。' }),
          },
        ]}
        ctas={[
          { label: t('store.heroCtaPrimary', { defaultValue: '今すぐ購入する' }), to: '/products' },
          { label: 'Guide / FAQ', to: '/guide', style: 'secondary' },
          { label: 'FC Join', to: fanclubLink(ROUTES.FC_JOIN), style: 'secondary' },
        ]}
      />

      <SeoInternalLinkSection
        title="store 回遊ハブ"
        description="商品詳細へ進む前後の不安解消と、main / fanclub 連携導線をまとめています。"
        items={[
          { href: '/products', title: '全商品', description: 'カテゴリ横断で商品を比較して探す。' },
          { href: '/guide', title: '購入ガイド', description: '配送・返品・購入フローの詳細を確認。' },
          { href: '/faq', title: 'FAQ', description: '問い合わせ前のセルフサポート導線。' },
          { href: '/news', title: 'ストアニュース', description: '新着・限定・再入荷情報を確認。' },
          { href: fanclubLink('/join'), title: 'FC特典', description: '会員向け先行販売と特典情報へ。' },
          { href: ROUTES.STORE_CONTACT, title: 'お問い合わせ', description: '購入前後のサポート導線。' },
        ]}
      />

      <EasterEggTrigger
        id="store-hero-seasonal-source"
        triggerCount={7}
        message="🎉 見つけてくれてありがとう。"
        location="store_home_hero"
        className="mt-3 inline-block"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 cursor-default">
          {t('seasonal.themeSource', { source: resolution.source })}
        </p>
      </EasterEggTrigger>
      {primaryCampaign && <CampaignHero campaign={primaryCampaign} location="store_home_campaign_hero" />}

      {sectionResolver('store-home-pickup', true) && !loading && !error && pickup.length > 0 && (
        <SectionReveal className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <p className="section-eyebrow">Editor's Pick</p>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {pickup.map((item, index) => (
              <Link
                key={item.id}
                to={`/products/${item.slug}`}
                onClick={() => trackCtaClick('store_home_pickup', 'pickup_click', { slug: item.slug })}
                className={`group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300/80 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 ${index === 0 ? 'lg:col-span-2' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-violet-950/20" />
                <p className="relative font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Editor's pick</p>
                <h2 className="relative mt-2 text-lg font-semibold text-gray-900 group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</h2>
                <p className="relative mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">詳細ページで商品の仕様や購入条件を確認できます。</p>
                <p className="relative mt-4 font-mono text-[11px] text-gray-400 transition-colors group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300">詳細を見る →</p>
              </Link>
            ))}
            <Link
              to="/news"
              onClick={() => trackCtaClick('store_home_pickup', 'news')}
              className="flex flex-col justify-between rounded-2xl border border-dashed border-gray-200/80 p-5 text-sm text-gray-500 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900/50"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600">週次更新</p>
              <p className="mt-2 font-medium text-gray-700 dark:text-gray-300">今週のおすすめ・お知らせを見る</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">News一覧へ →</p>
            </Link>
          </div>
        </SectionReveal>
      )}

      {/* 画像つき特集ブロック — featured / pickup / campaign を画像で見せ場に */}
      {sectionResolver('store-home-visual-feature', true) && (
        <SectionReveal className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="section-eyebrow mb-1">Visual Feature</p>
              <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                画像で見るストア特集
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                featured / pickup / campaign の見せ場を画像で整理しました。
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ImageFeatureTile
              href="/products"
              image={featuredImageUrl ?? collectionHeroImages[0] ?? null}
              alt="featured collection"
              eyebrow="FEATURED"
              title="今月の特集ラインナップ"
              description="編集部が推したい商品を画像つきで紹介。"
              ctaLabel="全商品を見る"
              variant="editorial"
              tone="default"
              className="lg:col-span-2"
              onClick={() => trackCtaClick('store_home_visual_feature', 'featured_tile')}
            />
            <ImageFeatureTile
              href="/products"
              image={pickupImageUrl ?? collectionHeroImages[1] ?? null}
              alt="pickup"
              eyebrow="PICKUP"
              title="ピックアップ"
              description="注目アイテムを厳選。"
              ctaLabel="見る"
              tone="accent"
              onClick={() => trackCtaClick('store_home_visual_feature', 'pickup_tile')}
            />
            <ImageFeatureTile
              href="/collections/digital"
              image={campaignImageUrl ?? collectionHeroImages[2] ?? null}
              alt="campaign"
              eyebrow="CAMPAIGN"
              title="キャンペーン / 限定ドロップ"
              description="期間・数量限定のアイテムをまとめて案内します。"
              ctaLabel="詳細"
              tone="campaign"
              onClick={() => trackCtaClick('store_home_visual_feature', 'campaign_tile')}
            />
            <ImageFeatureTile
              href={fanclubLink(ROUTES.FC_JOIN)}
              image={collectionHeroImages[3] ?? collectionHeroImages[0] ?? null}
              alt="member"
              eyebrow="MEMBER"
              title="FC先行・会員特典"
              description="会員向け先行販売と特典導線。"
              ctaLabel="FCを見る"
              tone="member"
              className="lg:col-span-2"
              onClick={() => trackCtaClick('store_home_visual_feature', 'member_tile')}
            />
          </div>
        </SectionReveal>
      )}

      {sectionResolver('store-home-bento', true) && <CuratedBentoSection
        eyebrow="editorial flow"
        title="特集・ピックアップ・回遊導線"
        subtitle="ストア体験の没入感と再訪理由を、編集構成で直感的に届けるセクション。"
        items={curatedBentoItems}
      />}

      {sectionResolver('store-home-spotlight', true) && <EditorialSpotlightSection
        title="特集・キャンペーン"
        subtitle="今見てほしい商品を編集視点で再構成"
        items={spotlightItems}
      />}

      {sectionResolver('store-home-new-arrivals', true) && (
        <SectionReveal className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-eyebrow mb-1">New Arrivals</p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">最新商品</h2>
            </div>
            <Link
              to="/products"
              onClick={() => trackCtaClick('store_home_new_arrival', 'more')}
              className="group inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            >
              もっと見る
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          {loading && <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, idx) => <SkeletonProductCard key={idx} />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} location="store_home_new_arrival" />}
          {!loading && !error && newArrivals.length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-400">
              公開中の商品はまだありません。
            </p>
          )}
          {!loading && !error && newArrivals.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {newArrivals.map((product) => <ProductCard key={product.id} product={product} trackingLocation="store_home_new_arrival" />)}
            </div>
          )}
        </SectionReveal>
      )}

      {sectionResolver('store-home-collections', true) && (
        <SectionReveal className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <p className="section-eyebrow">Collections</p>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {DEFAULT_COLLECTIONS.map((collection) => (
              <Link
                key={collection.slug}
                to={`/collections/${collection.slug}`}
                onClick={() => trackCtaClick('store_home_collection', 'collection_click', { collection: collection.slug })}
                className="group rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300/80 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-gray-700"
              >
                <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500 transition-colors group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200">{collection.name}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-400 dark:text-gray-500">{collection.description}</p>
              </Link>
            ))}
          </div>
        </SectionReveal>
      )}


      {sectionResolver('store-home-weekly-update', true) && <div id="store-weekly-update">
      <UpdateDigestSection
        title="今週の更新・注目"
        subtitle="新着 / 先行 / 重要導線をまとめて再訪しやすく整理"
        items={digestItems}
      />
      </div>}

      {/* ── playful: 日替わり + 週替わりブロック ─────────── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <DailyMessageCard
          seasonalTheme={resolution.theme}
          location="store_home_daily"
          className="sm:col-span-1"
        />
        <WeeklyPickupCard
          location="store_home_weekly_pickup"
          className="sm:col-span-1"
        />
        <SurpriseCard
          teaser={t('playful.surpriseTeaser', { defaultValue: '今週のひみつを見る' })}
          title={t('playful.storeSurpriseTitle', { defaultValue: '今週の編集部からひとこと' })}
          body={t('playful.storeSurpriseBody', { defaultValue: '毎週少し視点を変えながら、ストアをキュレーションしています。今週もゆっくり見ていってください。' })}
          href="/news"
          ctaLabel={t('playful.storeSurpriseCta', { defaultValue: 'ニュースを見る' })}
          periodLabel="weekly"
          location="store_home_surprise"
          className="sm:col-span-1"
        />
      </div>

      {sectionResolver('store-home-member-pickup', true) && !loading && !error && memberPickup.length > 0 && (
        <SectionReveal className="mt-12">
          <section className="relative overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/30 p-5 shadow-sm dark:border-violet-900/50 dark:bg-violet-950/15 dark:from-transparent dark:to-transparent sm:p-7">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-400/5 blur-3xl dark:bg-violet-500/5" aria-hidden="true" />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">member benefit · early access</p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">会員向け販売・先行導線</h2>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">FC先行・会員特典つき商品の導線をまとめて表示します。</p>
              </div>
              <Link
                to={fanclubLink(ROUTES.FC_MYPAGE)}
                onClick={() => trackCtaClick('store_home_member_pickup', 'to_fc_mypage')}
                className="shrink-0 rounded-full border border-violet-300/80 px-4 py-2 text-xs font-medium text-violet-700 transition-all hover:border-violet-400 hover:bg-violet-50 dark:border-violet-700/60 dark:text-violet-300 dark:hover:border-violet-600 dark:hover:bg-violet-950/30"
              >
                FCマイページで特典を確認 →
              </Link>
            </div>
            <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
              {memberPickup.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/products/${item.slug}`}
                    onClick={() => trackCtaClick('store_home_member_pickup', 'product_click', { slug: item.slug })}
                    className="group block rounded-2xl border border-violet-200/80 bg-white/90 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/80 hover:shadow-sm dark:border-violet-900/60 dark:bg-gray-900/80 dark:hover:border-violet-800/60"
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
                      {item.earlyAccess ? 'EARLY ACCESS' : 'MEMBER BENEFIT'}
                    </p>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{item.specialOffer ?? item.memberBenefit ?? '会員向け販売情報を商品詳細で確認できます。'}</p>
                    <p className="mt-3 font-mono text-[10px] text-gray-400 transition-colors group-hover:text-violet-600 dark:text-gray-600 dark:group-hover:text-violet-400">詳細へ →</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </SectionReveal>
      )}

      {sectionResolver('store-home-featured', true) && !loading && !error && (featured.length > 0 || digitalGoods.length > 0) && (
        <SectionReveal className="mt-14 grid gap-10 lg:grid-cols-2">
          {featured.length > 0 && (
            <div>
              <p className="section-eyebrow mb-2">Featured</p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">特集商品</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {featured.map((product) => <ProductCard key={product.id} product={product} trackingLocation="store_home_featured" />)}
              </div>
            </div>
          )}
          {digitalGoods.length > 0 && (
            <div>
              <p className="section-eyebrow mb-2">Digital Goods</p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">デジタル商品</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {digitalGoods.map((product) => <ProductCard key={product.id} product={product} trackingLocation="store_home_digital" />)}
              </div>
            </div>
          )}
        </SectionReveal>
      )}

      {sectionResolver('store-home-news-support', true) && (
        <SectionReveal className="mt-14 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-eyebrow mb-1">News</p>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">お知らせ</h2>
              </div>
              <Link to="/news" onClick={() => trackCtaClick('store_home_news', 'list')} className="group inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200">
                一覧へ <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
            {newsLoading && <p className="text-sm text-gray-400">読み込み中...</p>}
            {newsError && <ErrorState message={newsError} onRetry={refetchNews} location="store_home_news" />}
            {!newsLoading && !newsError && (!news || news.length === 0) && <p className="text-sm text-gray-400">お知らせはまだありません。</p>}
            {!newsLoading && !newsError && news && news.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {news.map((item) => (
                  <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                    <Link to={`/news/${item.slug}`} onClick={() => trackCtaClick('store_home_news', 'news_click', { slug: item.slug })} className="block text-sm text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-eyebrow mb-1">Support</p>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">FAQ / ガイド</h2>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Link to="/faq" onClick={() => trackCtaClick('store_home_support', 'faq')} className="text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200">FAQ</Link>
                <Link to="/guide" onClick={() => trackCtaClick('store_home_support', 'guide')} className="text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200">Guide</Link>
              </div>
            </div>
            {faqLoading && <p className="text-sm text-gray-400">読み込み中...</p>}
            {faqError && <ErrorState message={faqError} onRetry={refetchFaq} location="store_home_faq" />}
            {!faqLoading && !faqError && (!faqs || faqs.length === 0) && <p className="text-sm text-gray-400">FAQ は準備中です。</p>}
            {!faqLoading && !faqError && faqs && faqs.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {faqs.map((item) => (
                  <li key={item.id} className="py-2 first:pt-0 last:pb-0 text-sm text-gray-600 dark:text-gray-300">Q. {item.question}</li>
                ))}
              </ul>
            )}
          </div>
        </SectionReveal>
      )}

      {/* ── playful: hidden quote ─────────────────────── */}
      <HiddenQuote
        quote={t('playful.storeHiddenQuote', { defaultValue: '欲しいものを丁寧に選ぶことが、自分の世界観をつくる。' })}
        author="mizzz store"
        location="store_home_bottom"
        className="mt-8"
      />
    </section>
  )
}
