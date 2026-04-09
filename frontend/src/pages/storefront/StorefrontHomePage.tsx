import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProductList } from '@/modules/store/hooks/useProductList'
import ProductCard from '@/modules/store/components/ProductCard'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
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
import { createSectionVisibilityResolver, parseTopPageSections } from '@/lib/editorial'

export default function StorefrontHomePage() {
  const { i18n } = useTranslation()
  const { products, loading, error, refetch } = useProductList(24)
  const { item: settings } = useStrapiSingle(() => getSiteSettings({
    locale: i18n.resolvedLanguage,
    fields: ['heroTitle', 'heroSubtitle', 'heroCopy', 'heroSubcopy', 'heroCTALabel', 'heroCTAUrl', 'topPageSections', 'announcementText', 'announcementUrl', 'weeklyHighlightTitle', 'weeklyHighlightUrl'],
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
  useEffect(() => {
    if (error) trackApiFailure('store_home_products', error)
  }, [error])
  useEffect(() => {
    if (!loading && !error && newArrivals.length === 0) trackEmptyState('store_home_new_arrival')
  }, [error, loading, newArrivals.length])

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <PageHead title="mizzz Official Store" description="mizzz公式オンラインストア。新商品・デジタル商品・お知らせをまとめて確認できます。" />

      <VisualHeroSection
        location="store_home_hero"
        eyebrow="mizzz official store"
        badge={settings?.announcementText?.trim() || 'featured / pickup / weekly update'}
        title={settings?.heroTitle?.trim() || '静けさの中で、'}
        subtitle={settings?.heroSubtitle?.trim() || '欲しいものに迷わず届く。'}
        description={settings?.heroCopy?.trim() || '新着・限定・デジタル商品をエディトリアルに整理。商品が少ない時も、多い時も、見つけやすく心地よいストア体験を保ちます。'}
        illustrationVariant="store"
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
      {primaryCampaign && <CampaignHero campaign={primaryCampaign} location="store_home_campaign_hero" />}

      {sectionResolver('store-home-pickup', true) && !loading && !error && pickup.length > 0 && (
        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {pickup.map((item, index) => (
            <Link key={item.id} to={`/products/${item.slug}`} onClick={() => trackCtaClick('store_home_pickup', 'pickup_click', { slug: item.slug })} className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${index === 0 ? 'lg:col-span-2' : ''}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Editor's pick</p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">詳細ページで商品の仕様や購入条件を確認できます。</p>
            </Link>
          ))}
          <Link to="/news" onClick={() => trackCtaClick('store_home_pickup', 'news')} className="rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-600 transition hover:border-gray-500 dark:border-gray-700 dark:text-gray-300">
            今週のおすすめ・お知らせを見る →
          </Link>
        </section>
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

      {sectionResolver('store-home-new-arrivals', true) && <SectionReveal className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">New Arrival</h2>
          <Link to="/products" onClick={() => trackCtaClick('store_home_new_arrival', 'more')} className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">もっと見る →</Link>
        </div>
        {loading && <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, idx) => <SkeletonProductCard key={idx} />)}</div>}
        {error && <ErrorState message={error} onRetry={refetch} location="store_home_new_arrival" />}
        {!loading && !error && newArrivals.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">公開中の商品はまだありません。</p>}
        {!loading && !error && newArrivals.length > 0 && <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{newArrivals.map((product) => <ProductCard key={product.id} product={product} trackingLocation="store_home_new_arrival" />)}</div>}
      </SectionReveal>}

      {sectionResolver('store-home-collections', true) && <SectionReveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {DEFAULT_COLLECTIONS.map((collection) => (
          <Link key={collection.slug} to={`/collections/${collection.slug}`} onClick={() => trackCtaClick('store_home_collection', 'collection_click', { collection: collection.slug })} className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">{collection.name}</p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{collection.description}</p>
          </Link>
        ))}
      </SectionReveal>}


      {sectionResolver('store-home-weekly-update', true) && <div id="store-weekly-update">
      <UpdateDigestSection
        title="今週の更新・注目"
        subtitle="新着 / 先行 / 重要導線をまとめて再訪しやすく整理"
        items={digestItems}
      />
      </div>}

      {sectionResolver('store-home-member-pickup', true) && !loading && !error && memberPickup.length > 0 && (
        <section className="mt-12 rounded-3xl border border-violet-200/70 bg-violet-50/60 p-5 dark:border-violet-900/60 dark:bg-violet-950/20 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">member benefit / early access</p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">会員向け販売・先行導線</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">FC先行・会員特典つき商品の導線をまとめて表示します。</p>
            </div>
            <Link to={fanclubLink(ROUTES.FC_MYPAGE)} onClick={() => trackCtaClick('store_home_member_pickup', 'to_fc_mypage')} className="rounded-full border border-violet-300 px-4 py-2 text-xs font-medium text-violet-700 dark:border-violet-700 dark:text-violet-300">
              FCマイページで特典を確認
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {memberPickup.map((item) => (
              <Link key={item.id} to={`/products/${item.slug}`} onClick={() => trackCtaClick('store_home_member_pickup', 'product_click', { slug: item.slug })} className="rounded-2xl border border-violet-200 bg-white/85 p-4 dark:border-violet-900/70 dark:bg-gray-900/80">
                <p className="font-mono text-[10px] uppercase tracking-wider text-violet-500">{item.earlyAccess ? 'EARLY ACCESS' : 'MEMBER BENEFIT'}</p>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{item.specialOffer ?? item.memberBenefit ?? '会員向け販売情報を商品詳細で確認できます。'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sectionResolver('store-home-featured', true) && <SectionReveal className="mt-12 grid gap-10 lg:grid-cols-2">
        {!loading && !error && featured.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Featured</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">{featured.map((product) => <ProductCard key={product.id} product={product} trackingLocation="store_home_featured" />)}</div>
          </div>
        )}

        {!loading && !error && digitalGoods.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Digital Goods</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">{digitalGoods.map((product) => <ProductCard key={product.id} product={product} trackingLocation="store_home_digital" />)}</div>
          </div>
        )}
      </SectionReveal>}

      {sectionResolver('store-home-news-support', true) && <SectionReveal className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">お知らせ</h2>
            <Link to="/news" onClick={() => trackCtaClick('store_home_news', 'list')} className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">一覧へ →</Link>
          </div>
          {newsLoading && <p className="text-sm text-gray-500">読み込み中...</p>}
          {newsError && <ErrorState message={newsError} onRetry={refetchNews} location="store_home_news" />}
          {!newsLoading && !newsError && (!news || news.length === 0) && <p className="text-sm text-gray-500">お知らせはまだありません。</p>}
          {!newsLoading && !newsError && news && news.length > 0 && (
            <ul className="space-y-2">
              {news.map((item) => (
                <li key={item.id}>
                  <Link to={`/news/${item.slug}`} onClick={() => trackCtaClick('store_home_news', 'news_click', { slug: item.slug })} className="text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">FAQ / Guide</h2>
            <div className="flex items-center gap-2 text-xs">
              <Link to="/faq" onClick={() => trackCtaClick('store_home_support', 'faq')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">FAQ</Link>
              <Link to="/guide" onClick={() => trackCtaClick('store_home_support', 'guide')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">Guide</Link>
            </div>
          </div>
          {faqLoading && <p className="text-sm text-gray-500">読み込み中...</p>}
          {faqError && <ErrorState message={faqError} onRetry={refetchFaq} location="store_home_faq" />}
          {!faqLoading && !faqError && (!faqs || faqs.length === 0) && <p className="text-sm text-gray-500">FAQ は準備中です。</p>}
          {!faqLoading && !faqError && faqs && faqs.length > 0 && (
            <ul className="space-y-2">
              {faqs.map((item) => (
                <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300">Q. {item.question}</li>
              ))}
            </ul>
          )}
        </div>
      </SectionReveal>}
    </section>
  )
}
