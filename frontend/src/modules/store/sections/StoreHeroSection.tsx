import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import type { StoreProductSummary } from '@/modules/store/types'

interface Props {
  products: StoreProductSummary[]
  region: 'JP' | 'US' | 'EU' | 'ROW'
  heroVariant: 'A' | 'B'
  ctaVariant: 'A' | 'B'
}

export default function StoreHeroSection({ products, region, heroVariant, ctaVariant }: Props) {
  const { t } = useTranslation()
  const availableCount = products.filter((p) => p.purchaseStatus === 'available').length
  const limitedCount = products.filter((p) => p.isLimited || p.campaignType === 'drop').length

  return (
    <section className="relative overflow-hidden store-hero-surface">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.35),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.15),transparent_55%)]" />
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-10" />

      {/* 微細なライン装飾 */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:items-center">
          {/* 左: コピー */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-indigo-300/80">
              mizzz official store
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[56px]">
              {t('store.title')}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-indigo-100/80">
              {heroVariant === 'A'
                ? t('store.ecHeroCopyA', { defaultValue: '新作ドロップ・限定販売・先行案内を1ページで完結。お気に入りから最短導線で購入できます。' })
                : t('store.ecHeroCopyB', { defaultValue: 'キャンペーン、ランキング、再販通知を統合したEC体験で、欲しいアイテムに最短でアクセスできます。' })}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#store-products"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl"
              >
                {ctaVariant === 'A'
                  ? t('store.heroCtaPrimary', { defaultValue: '今すぐ購入する' })
                  : t('store.heroCtaPrimaryAlt', { defaultValue: '人気商品を見る' })}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <Link
                to={ROUTES.CART}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/30"
              >
                {t('cart.goToCart', { defaultValue: 'カートを見る' })}
              </Link>
            </div>

            {/* キャンペーン補足 */}
            <div className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              <span className="text-xs text-white/80">
                {t('store.campaignTitle', { defaultValue: '春の限定ドロップ' })}
                <span className="ml-2 font-mono text-[10px] text-indigo-200/60">
                  — {t('store.campaignBody', { defaultValue: '会員先行販売・限定バンドルあり' })}
                </span>
              </span>
              <Link
                to={ROUTES.FANCLUB}
                className="shrink-0 font-mono text-[10px] text-violet-300 underline underline-offset-2 transition-colors hover:text-violet-200"
              >
                {t('store.campaignCta', { defaultValue: '詳細を見る' })}
              </Link>
            </div>
          </motion.div>

          {/* 右: 統計カード */}
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <div className="w-[220px] space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-indigo-300/50">
                // store.status
              </p>
              {[
                { label: 'PRODUCTS', value: `${products.length}+`, color: 'text-cyan-300' },
                { label: 'AVAILABLE', value: `${availableCount}`, color: 'text-emerald-300' },
                { label: 'LIMITED', value: `${limitedCount}`, color: 'text-violet-300' },
                { label: 'REGION', value: region, color: 'text-amber-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between border-t border-white/5 pt-2">
                  <span className="font-mono text-[9px] text-indigo-300/40 tracking-widest">{label}</span>
                  <span className={`font-mono text-[10px] font-medium ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
