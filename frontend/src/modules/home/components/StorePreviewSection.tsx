import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { fanclubLink, storeLink } from '@/lib/siteLinks'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import Badge from '@/components/common/Badge'
import { formatPriceNum } from '@/utils'
import { useHomeCtaAnalytics } from '@/modules/analytics/useHomeCtaAnalytics'
import { useTilt } from '@/hooks/useTilt'
import SectionHeader from '@/components/common/SectionHeader'

/* ── Single product card ──────────────────────────── */
function ProductCard({ product, index }: { product: ReturnType<typeof useProductList>['products'][number]; index: number }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLAnchorElement>({ maxTilt: 6, scale: 1.02 })

  return (
    <Link
      ref={ref}
      to={detailPath.product(product.slug)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative block shrink-0 w-[260px] md:w-[300px] overflow-hidden focus-ring"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-cyber-800 dark:bg-cyber-950">
        {product.previewImage ? (
          <>
            <img
              src={product.previewImage.url}
              alt={product.previewImage.alt ?? product.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              loading="lazy"
            />
            {/* Shimmer overlay on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, transparent 50%, rgba(245,158,11,0.04) 100%)',
              }}
            />
          </>
        ) : (
          <div className="cyber-grid-fine flex h-full w-full items-center justify-center">
            <span className="font-mono text-[10px] text-cyan-500/20 group-hover:text-cyan-500/40 transition-colors">
              item_{String(index + 1).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Soldout overlay */}
        {product.purchaseStatus === 'soldout' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(6,6,15,0.7)] backdrop-blur-sm">
            <Badge variant="soldout" size="sm" />
          </div>
        )}

        {/* Status badges */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1">
          {product.accessStatus === 'fc_only'  && <Badge variant="fc"          />}
          {product.accessStatus === 'limited'   && <Badge variant="limited"     />}
          {product.purchaseStatus === 'coming_soon' && <Badge variant="coming_soon" />}
        </div>

        {/* Cyber corner marks */}
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-cyan-500/0 group-hover:border-cyan-500/40 transition-all duration-400" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-cyan-500/0 group-hover:border-cyan-500/40 transition-all duration-400" />

        {/* Scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent"
            style={{ animation: 'scanline 2.5s linear infinite', top: '-100%' }}
          />
        </div>

        {/* Index label */}
        <span className="absolute left-2.5 top-2.5 font-mono text-[8px] tracking-widest text-white/0 group-hover:text-cyan-400/60 transition-colors duration-300">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Meta */}
      <div className="pt-3 px-0.5">
        <p className="line-clamp-1 text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-cyan-400 dark:group-hover:text-cyan-300 transition-colors duration-200">
          {product.title}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="font-mono text-xs text-[rgba(6,182,212,0.6)]">
            {product.purchaseStatus === 'soldout'
              ? <span className="text-red-400/60">sold out</span>
              : product.purchaseStatus === 'coming_soon'
                ? <span className="text-amber-400/60">coming soon</span>
                : formatPriceNum(product.price, product.currency)}
          </p>
          <motion.span
            className="font-mono text-[10px] text-[rgba(6,182,212,0.3)] group-hover:text-cyan-400 transition-colors"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            →
          </motion.span>
        </div>
        {/* Animated underline */}
        <div className="mt-1.5 h-px w-0 bg-gradient-to-r from-cyan-500/60 to-transparent group-hover:w-full transition-all duration-400 ease-out" />
      </div>
    </Link>
  )
}

/* ── Skeleton card ────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="shrink-0 w-[260px] md:w-[300px]">
      <div className="skeleton aspect-[3/4]" />
      <div className="skeleton mt-3 h-3 w-3/4 rounded" />
      <div className="skeleton mt-2 h-2.5 w-20 rounded" />
    </div>
  )
}

/* ── Main section ─────────────────────────────────── */
export default function StorePreviewSection() {
  const { t } = useTranslation()
  const trackHomeCta = useHomeCtaAnalytics('store_preview')
  const { products, loading } = useProductList(8)
  const trackRef = useRef<HTMLDivElement>(null)

  const previewItems = products.filter((p) => p.accessStatus !== 'fc_only').slice(0, 6)

  // Horizontal scroll driven by vertical scroll
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start end', 'end start'],
  })
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-25%'])

  return (
    <section
      ref={trackRef}
      className="relative overflow-hidden border-t border-[rgba(6,182,212,0.08)] bg-[rgba(6,6,15,0.02)] dark:bg-[rgba(6,6,15,0.6)] py-20"
    >
      {/* Subtle bg grid */}
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-20" />

      <div className="relative">
        {/* ── Header ──────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-end justify-between gap-4 mb-2">
            <div>
              <span className="section-eyebrow">store</span>
            </div>
          </div>
          <SectionHeader
            label={t('home.store.title')}
            viewAllTo={storeLink(ROUTES.STORE)}
            viewAllLabel={t('home.store.viewAll')}
          />
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(6,182,212,0.3)]">
            {t('store.stripeLead')}
          </p>
        </div>

        {/* ── Horizontal scroll track ──────────────── */}
        <div className="mt-8 overflow-hidden">
          {loading ? (
            <div className="flex gap-4 px-4 md:px-[calc((100vw-72rem)/2+1rem)] pb-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : previewItems.length > 0 ? (
            <motion.div
              className="flex gap-5 px-4 md:px-[max(1rem,calc((100vw-72rem)/2+1rem))] pb-6"
              style={{ x }}
            >
              {previewItems.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* ── Coming soon placeholder ── */
            <div className="flex gap-4 px-4 md:px-[calc((100vw-72rem)/2+1rem)] pb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[260px] md:w-[300px] aspect-[3/4] cyber-grid-fine flex flex-col items-center justify-center border border-dashed border-[rgba(6,182,212,0.1)]"
                >
                  <span className="font-mono text-[10px] text-cyan-500/20 uppercase tracking-widest">
                    {t('home.store.comingSoon')}
                  </span>
                  <span className="mt-1 font-mono text-[9px] text-cyan-500/10">
                    item_{String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer links ──────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4 mt-6 flex flex-wrap items-center gap-5">
          <Link
            to={storeLink(ROUTES.STORE)}
            onClick={() => trackHomeCta('store')}
            className="btn-cyber-ghost inline-flex items-center gap-2 text-sm"
          >
            {t('home.store.viewAll')} →
          </Link>
          <Link
            to={fanclubLink(ROUTES.FANCLUB)}
            onClick={() => trackHomeCta('fanclub')}
            className="font-mono text-[10px] uppercase tracking-widest text-violet-400/60 hover:text-violet-400 transition-colors"
          >
            {t('store.fanclubLead')} →
          </Link>
        </div>
      </div>
    </section>
  )
}
