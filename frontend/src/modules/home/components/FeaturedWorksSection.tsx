import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { getMediaUrl } from '@/utils'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import SectionHeader from '@/components/common/SectionHeader'
import WorkCard from '@/components/cards/WorkCard'
import Badge from '@/components/common/Badge'
import { useTilt } from '@/hooks/useTilt'
import type { Work } from '@/types/content'

function hasCaseStudy(work: Work) {
  return Boolean(
    work.caseStudyBackground
    || work.caseStudyGoal
    || work.caseStudyApproach
    || work.caseStudyImplementation
    || work.caseStudyResult,
  )
}

/* ── Featured hero card (spans 2 cols) ────────────── */
function HeroCard({ work }: { work: Work }) {
  const thumb = getMediaUrl(work.thumbnail, 'large') ?? getMediaUrl(work.thumbnail)
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLAnchorElement>({ maxTilt: 5, scale: 1.01 })

  return (
    <Link
      ref={ref}
      to={detailPath.work(work.slug)}
      className="group relative col-span-2 overflow-hidden bg-cyber-900 dark:bg-cyber-950 md:col-span-2"
      style={{ aspectRatio: '2 / 1' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Image */}
      {thumb ? (
        <img
          src={thumb}
          alt={work.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="cyber-grid flex h-full w-full items-center justify-center opacity-60">
          <span className="font-mono text-[10px] text-cyan-500/30">01</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,6,15,0.75)] via-[rgba(6,6,15,0.2)] to-transparent" />

      {/* Hover glint */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, transparent 50%, rgba(139,92,246,0.04) 100%)',
        }}
      />

      {/* Cyber corner marks */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-cyan-400/0 group-hover:border-cyan-400/50 transition-all duration-400" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-cyan-400/0 group-hover:border-cyan-400/50 transition-all duration-400" />

      {/* Bottom meta */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            {work.category && (
              <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400/60 mb-1">
                {work.category}
              </span>
            )}
            <h3 className="text-lg font-display font-bold text-white leading-tight group-hover:text-cyan-200 transition-colors duration-300">
              {work.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {hasCaseStudy(work) && (
              <span className="rounded-sm border border-cyan-400/40 bg-[rgba(6,182,212,0.12)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-400 backdrop-blur-sm">
                case
              </span>
            )}
            {work.isFeatured && <Badge variant="featured" />}
            {work.accessStatus === 'fc_only' && <Badge variant="fc" />}
          </div>
        </div>
      </div>

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
          style={{ animation: 'scanline 3s linear infinite', top: '-100%' }}
        />
      </div>
    </Link>
  )
}

/* ── Bento grid ───────────────────────────────────── */
function BentoGrid({ items }: { items: Work[] }) {
  const [first, ...rest] = items.slice(0, 4)

  const cardVariants = {
    hidden:  { opacity: 0, y: 24, filter: 'blur(4px)' },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
    }),
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
      {first && (
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={cardVariants}
          className="col-span-2 md:col-span-2"
        >
          <HeroCard work={first} />
        </motion.div>
      )}

      {rest.slice(0, 3).map((work, i) => (
        <motion.div
          key={work.id}
          custom={i + 1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={cardVariants}
        >
          <WorkCard
            title={work.title}
            href={detailPath.work(work.slug)}
            category={work.category}
            thumbnailUrl={getMediaUrl(work.thumbnail, 'small') ?? getMediaUrl(work.thumbnail)}
            index={i + 1}
            isFeatured={work.isFeatured}
            status={work.accessStatus}
            hasCaseStudy={hasCaseStudy(work)}
          />
        </motion.div>
      ))}
    </div>
  )
}

/* ── Placeholder slots ────────────────────────────── */
function WorksPlaceholder({ count }: { count: number }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="cyber-grid-fine flex aspect-square items-center justify-center border border-dashed border-[rgba(6,182,212,0.12)] bg-[rgba(6,182,212,0.02)] dark:border-[rgba(6,182,212,0.08)]"
        >
          <span className="font-mono text-[10px] text-cyan-500/20 dark:text-cyan-500/15">
            slot_{String(i + 1).padStart(2, '0')}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Main section ─────────────────────────────────── */
export default function FeaturedWorksSection() {
  const { t } = useTranslation()
  const { items, loading } = useStrapiCollection<Work>(() =>
    getWorksList({ pagination: { pageSize: 8 } }),
  )

  const featured = items
    ? items.some((w) => w.isFeatured)
      ? items.filter((w) => w.isFeatured)
      : items.slice(0, 4)
    : []

  return (
    <motion.section
      className="relative mx-auto max-w-5xl px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      {/* Section eyebrow accent */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px w-8 bg-gradient-to-r from-cyan-500/60 to-transparent" />
        <span className="section-eyebrow">works</span>
      </div>

      <SectionHeader
        label={t('home.works.title')}
        viewAllTo={ROUTES.WORKS}
        viewAllLabel={t('home.works.viewAll')}
      />

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="skeleton col-span-2 md:col-span-2" style={{ aspectRatio: '2 / 1' }} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton aspect-square" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && featured.length === 0 && (
        <div className="mt-8 border border-dashed border-[rgba(6,182,212,0.15)] p-6 dark:border-[rgba(6,182,212,0.1)]">
          <p className="font-mono text-[11px] text-[rgba(6,182,212,0.4)]">
            {t('home.works.empty')}
          </p>
          <Link
            to={ROUTES.CONTACT}
            className="focus-ring mt-3 inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-cyan-500 dark:text-gray-300 dark:hover:text-cyan-400"
          >
            {t('home.works.emptyCta')} →
          </Link>
        </div>
      )}

      {!loading && featured.length > 0 && <BentoGrid items={featured} />}
      {!loading && featured.length > 0 && featured.length < 4 && (
        <WorksPlaceholder count={4 - featured.length} />
      )}

      {/* View all */}
      {!loading && featured.length > 0 && (
        <motion.div
          className="mt-6 flex justify-end"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            to={ROUTES.WORKS}
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(6,182,212,0.5)] transition-colors hover:text-cyan-400"
          >
            {t('home.works.viewAll')}
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      )}
    </motion.section>
  )
}
