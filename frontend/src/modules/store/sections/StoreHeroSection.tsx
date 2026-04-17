import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import type { StoreProductSummary } from '@/modules/store/types'
import type { SiteSettings } from '@/types'
import HeroImageSlider, { type HeroSlide } from '@/components/common/HeroImageSlider'
import { buildStoreHeroFallbackSlides, normalizeHeroSlides } from '@/lib/heroSlides'
import { trackCtaClick } from '@/modules/analytics/tracking'

interface Props {
  products: StoreProductSummary[]
  region: 'JP' | 'US' | 'EU' | 'ROW'
  heroVariant: 'A' | 'B'
  ctaVariant: 'A' | 'B'
  /** CMS から渡す site settings（hero slide / copy 上書き用、任意）。 */
  settings?: SiteSettings | null
  /** CMS or ページ側で組み立てたスライド。指定があれば最優先。 */
  slides?: HeroSlide[]
}

export default function StoreHeroSection({ products, region, heroVariant, ctaVariant, settings, slides }: Props) {
  const { t } = useTranslation()
  const availableCount = products.filter((p) => p.purchaseStatus === 'available').length
  const limitedCount = products.filter((p) => p.isLimited || p.campaignType === 'drop').length

  const cmsSlides = slides ?? normalizeHeroSlides((settings as unknown as { heroSlides?: unknown })?.heroSlides)
  const resolvedSlides: HeroSlide[] = cmsSlides.length
    ? cmsSlides
    : buildStoreHeroFallbackSlides(settings ?? null, {
        title: t('store.heroSliderDefaultTitle', { defaultValue: 'featured / pickup / weekly update' }),
        description:
          heroVariant === 'A'
            ? t('store.ecHeroCopyA', {
                defaultValue:
                  '新作ドロップ・限定販売・先行案内を1ページで完結。お気に入りから最短導線で購入できます。',
              })
            : t('store.ecHeroCopyB', {
                defaultValue:
                  'キャンペーン、ランキング、再販通知を統合したEC体験で、欲しいアイテムに最短でアクセスできます。',
              }),
        ctaLabel:
          ctaVariant === 'A'
            ? t('store.heroCtaPrimary', { defaultValue: '今すぐ購入する' })
            : t('store.heroCtaPrimaryAlt', { defaultValue: '人気商品を見る' }),
        ctaHref: '#store-products',
      })

  return (
    <section className="relative overflow-hidden store-hero-surface" aria-label={t('store.title')}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.28),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.14),transparent_55%)]" />
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-[0.08]" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-stretch lg:gap-10">
          {/* 左: 画像スライダー */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <HeroImageSlider
              slides={resolvedSlides}
              aspectRatio="16/9"
              mobileAspectRatio="4/5"
              locationTag="store_hero_slider"
              onCtaClick={(slideIndex, kind) =>
                trackCtaClick('store_hero_slider', `${kind}_slide_${slideIndex}`, {
                  slide: String(resolvedSlides[slideIndex]?.id ?? slideIndex),
                })
              }
            />
            {/* subtle bottom fade into page */}
            <div className="pointer-events-none absolute inset-x-0 -bottom-3 h-12 bg-gradient-to-b from-transparent to-black/20 blur-xl" />
          </motion.div>

          {/* 右: コピー + ステータス */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-between gap-6"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-indigo-300/90">
                mizzz official store
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px]">
                {settings?.heroTitle?.trim() || t('store.title')}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-indigo-100/85">
                {settings?.heroCopy?.trim() ||
                  (heroVariant === 'A'
                    ? t('store.ecHeroCopyA', {
                        defaultValue:
                          '新作ドロップ・限定販売・先行案内を1ページで完結。お気に入りから最短導線で購入できます。',
                      })
                    : t('store.ecHeroCopyB', {
                        defaultValue:
                          'キャンペーン、ランキング、再販通知を統合したEC体験で、欲しいアイテムに最短でアクセスできます。',
                      }))}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#store-products"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl"
                  onClick={() => trackCtaClick('store_hero', 'primary_cta')}
                >
                  {ctaVariant === 'A'
                    ? t('store.heroCtaPrimary', { defaultValue: '今すぐ購入する' })
                    : t('store.heroCtaPrimaryAlt', { defaultValue: '人気商品を見る' })}
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
                <Link
                  to={ROUTES.CART}
                  onClick={() => trackCtaClick('store_hero', 'secondary_cart')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15"
                >
                  {t('cart.goToCart', { defaultValue: 'カートを見る' })}
                </Link>
              </div>
            </div>

            {/* キャンペーン補足 */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              <span className="text-xs text-white/85">
                {t('store.campaignTitle', { defaultValue: '春の限定ドロップ' })}
                <span className="ml-2 font-mono text-[10px] text-indigo-200/70">
                  — {t('store.campaignBody', { defaultValue: '会員先行販売・限定バンドルあり' })}
                </span>
              </span>
              <Link
                to={ROUTES.FANCLUB}
                onClick={() => trackCtaClick('store_hero', 'campaign_to_fc')}
                className="shrink-0 font-mono text-[10px] text-violet-300 underline underline-offset-2 transition-colors hover:text-violet-200"
              >
                {t('store.campaignCta', { defaultValue: '詳細を見る' })}
              </Link>
            </div>

            {/* 統計カード（常設） */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:grid-cols-4 lg:grid-cols-2">
              {[
                { label: 'PRODUCTS', value: `${products.length}+`, color: 'text-cyan-300' },
                { label: 'AVAILABLE', value: `${availableCount}`, color: 'text-emerald-300' },
                { label: 'LIMITED', value: `${limitedCount}`, color: 'text-violet-300' },
                { label: 'REGION', value: region, color: 'text-amber-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 first:border-t-0 first:pt-0 sm:border-t-0 sm:pt-0 lg:border-t lg:pt-2 lg:first:border-t-0 lg:first:pt-0">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-300/70">
                    {label}
                  </span>
                  <span className={`font-mono text-[11px] font-medium ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
    </section>
  )
}
