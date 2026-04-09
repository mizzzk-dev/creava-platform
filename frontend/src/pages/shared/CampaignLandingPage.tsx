import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import PageHead from '@/components/seo/PageHead'
import ErrorState from '@/components/common/ErrorState'
import NotFoundState from '@/components/common/NotFoundState'
import ProductCard from '@/modules/store/components/ProductCard'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { useSlugDetail } from '@/hooks'
import { getCampaignBySlug } from '@/modules/campaign/api'
import { trackCtaClick } from '@/modules/analytics/tracking'

export default function CampaignLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { item: campaign, loading, error, refetch, notFound } = useSlugDetail(getCampaignBySlug, slug)
  const { products } = useProductList(120)

  const relatedProducts = useMemo(
    () => products.filter((product) => product.campaignLabel === campaign?.campaignLabel || product.tags.includes(slug ?? '')).slice(0, 8),
    [campaign?.campaignLabel, products, slug],
  )

  if (!slug) return <NotFoundState backTo="/" />

  if (loading) {
    return <section className="mx-auto max-w-6xl px-4 py-12"><p className="text-sm text-gray-500">読み込み中...</p></section>
  }

  if (error) {
    return <section className="mx-auto max-w-6xl px-4 py-12"><ErrorState message={error} onRetry={refetch} location="campaign_landing" /></section>
  }

  if (notFound || !campaign) return <NotFoundState backTo="/" />

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHead
        title={`${campaign.title} | mizzz`}
        description={campaign.heroCopy ?? campaign.shortHighlight ?? 'キャンペーンページ'}
        ogImage={campaign.heroVisual?.url ?? undefined}
      />

      <header className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/70 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">{campaign.campaignLabel ?? campaign.campaignType}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">{campaign.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">{campaign.heroCopy ?? campaign.shortHighlight}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {campaign.ctaLink && (
            <Link to={campaign.ctaLink} onClick={() => trackCtaClick('campaign_landing', 'primary_cta', { slug: campaign.slug })} className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900">
              {campaign.ctaText ?? '詳細へ'}
            </Link>
          )}
          <Link to="/products" onClick={() => trackCtaClick('campaign_landing', 'to_products', { slug: campaign.slug })} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
            商品一覧へ
          </Link>
        </div>
      </header>

      {relatedProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">関連商品</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {relatedProducts.map((product) => <ProductCard key={product.id} product={product} trackingLocation="campaign_landing_related_products" />)}
          </div>
        </section>
      )}
    </section>
  )
}
