import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { detailPath } from '@/lib/routeConstants'
import { formatPriceNum } from '@/utils'
import { convertPrice, type DisplayCurrency } from '../lib/currency'
import Badge from '@/components/common/Badge'
import type { StoreProductSummary } from '../types'
import { trackCtaClick, trackProductCardClick } from '@/modules/analytics/tracking'
import { motionPresets } from '@/components/common/motionPresets'

interface Props {
  product: StoreProductSummary
  displayCurrency?: DisplayCurrency
  trackingLocation?: string
}

export default function ProductCard({ product, displayCurrency = 'JPY', trackingLocation = 'store_product_card' }: Props) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const isUnavailable = product.purchaseStatus !== 'available'

  const statusLabel =
    product.purchaseStatus === 'soldout'
      ? t('store.soldOut')
      : product.purchaseStatus === 'coming_soon'
        ? t('store.comingSoon')
        : formatPriceNum(convertPrice(product.price, product.currency, displayCurrency), displayCurrency)

  return (
    <motion.div
      variants={motionPresets.productCardReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      <Link
        to={detailPath.product(product.slug)}
        onClick={() => {
          trackCtaClick(trackingLocation, 'product_click', { slug: product.slug, status: product.purchaseStatus })
          trackProductCardClick(trackingLocation, product.slug, product.purchaseStatus)
        }}
        className="group block"
        aria-label={`${product.title} ${t('store.detailCta')}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <article className={`overflow-hidden rounded-2xl border bg-white shadow-[var(--ds-shadow-card)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[var(--ds-shadow-floating)] dark:bg-gray-900/85 ${
          isUnavailable
            ? 'border-gray-200/70 dark:border-gray-800/80'
            : 'border-gray-200/90 group-hover:border-gray-300 dark:border-gray-800 dark:group-hover:border-violet-800/50'
        }`}>
          {/* ── 画像エリア ──────────────────────────────── */}
          <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
            {/* 画像 */}
            {product.previewImage ? (
              <img
                src={product.previewImage.url}
                alt={product.previewImage.alt ?? product.title}
                className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-700">no image</span>
              </div>
            )}

            {/* グラジエントオーバーレイ */}
            <div className={`absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

            {/* ホバー時のグロー */}
            <motion.div
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-x-4 bottom-3 h-10 rounded-xl bg-white/40 blur-xl dark:bg-violet-400/20"
            />

            {/* 右上バッジ群 */}
            <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
              {product.campaignType === 'drop'    && <Badge variant="featured"    size="sm" label="DROP" />}
              {product.campaignType === 'restock' && <Badge variant="new"         size="sm" label="RESTOCK" />}
              {product.pickup                     && <Badge variant="pickup"      size="sm" />}
              {product.isTrending                 && <Badge variant="featured"    size="sm" label="TRENDING" />}
              {product.purchaseStatus === 'soldout'      && <Badge variant="soldout"    size="sm" />}
              {product.purchaseStatus === 'coming_soon'  && <Badge variant="coming_soon" size="sm" />}
              {product.isNewArrival                && <Badge variant="new"         size="sm" />}
              {product.isLimited                  && <Badge variant="limited"     size="sm" label="LIMITED" />}
            </div>

            {/* 左下バッジ群 */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              {product.accessStatus === 'fc_only' && <Badge variant="fc"      size="sm" label="MEMBERS" />}
              {product.accessStatus === 'limited' && <Badge variant="limited" size="sm" />}
              {product.earlyAccess                && <Badge variant="early"   size="sm" label={t('store.badgeEarly', { defaultValue: '先行' })} />}
              {product.memberBenefit              && <Badge variant="benefit" size="sm" label={t('store.badgeBenefit', { defaultValue: '特典' })} />}
            </div>
          </div>

          {/* ── テキストエリア ─────────────────────────── */}
          <div className="space-y-1.5 px-4 py-3.5">
            {/* タイトル + 矢印 */}
            <h3 className="flex items-start justify-between gap-2 text-sm font-medium leading-relaxed text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">
              <span className="line-clamp-2">{product.title}</span>
              <motion.span
                aria-hidden
                animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.18 }}
                className="mt-0.5 shrink-0 text-gray-400"
              >
                →
              </motion.span>
            </h3>

            {/* ハイライト */}
            {product.shortHighlight && product.purchaseStatus !== 'soldout' && (
              <p className="line-clamp-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{product.shortHighlight}</p>
            )}

            {/* 価格 / ステータス */}
            <div className="flex items-center justify-between gap-2">
              <p className={`font-mono text-sm font-medium price-badge ${
                isUnavailable ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'
              }`}>
                {statusLabel}
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                product.stock > 0
                  ? 'badge-in-stock'
                  : 'badge-soldout'
              }`}>
                {product.stock > 0 ? `在庫 ${product.stock}` : '在庫なし'}
              </span>
            </div>

            {/* 売り切れ補足 */}
            {product.purchaseStatus === 'soldout' && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {t('store.statusSoldout', { defaultValue: '再販情報は News / Fanclub で案内します。' })}
              </p>
            )}

            {/* FC限定補足 */}
            {product.accessStatus === 'fc_only' && product.purchaseStatus !== 'soldout' && (
              <p className="text-[10px] text-violet-600 dark:text-violet-400">{t('store.fcOnlyNote')}</p>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  )
}
