import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useSlugDetail } from '@/hooks'
import { getWorkDetail } from '@/modules/works/api'
import { getMediaUrl, formatDate } from '@/utils'
import { truncateForDescription } from '@/lib/seo'
import { ROUTES } from '@/lib/routeConstants'
import ContentAccessGuard from '@/components/guards/ContentAccessGuard'
import NotFoundState from '@/components/common/NotFoundState'
import ErrorState from '@/components/common/ErrorState'
import PageHead from '@/components/seo/PageHead'
import SkeletonDetail from '@/components/common/SkeletonDetail'
import Badge from '@/components/common/Badge'
import { SplitWords } from '@/components/common/KineticText'
import type { Work } from '@/types'

/* ── Case study section ───────────────────────────── */
function CaseStudySection({ item }: { item: Work }) {
  const { t } = useTranslation()

  const rows = [
    { label: t('work.case.background'),     value: item.caseStudyBackground,     num: '01', accent: 'cyan'   },
    { label: t('work.case.goal'),           value: item.caseStudyGoal,           num: '02', accent: 'amber'  },
    { label: t('work.case.approach'),       value: item.caseStudyApproach,       num: '03', accent: 'violet' },
    { label: t('work.case.implementation'), value: item.caseStudyImplementation, num: '04', accent: 'cyan'   },
    { label: t('work.case.result'),         value: item.caseStudyResult,         num: '05', accent: 'amber'  },
  ].filter((row) => Boolean(row.value))

  if (rows.length === 0) return null

  const accentColor = {
    cyan:   { text: '#06b6d4', border: 'rgba(6,182,212,0.2)'   },
    amber:  { text: '#f59e0b', border: 'rgba(245,158,11,0.2)'  },
    violet: { text: '#8b5cf6', border: 'rgba(139,92,246,0.2)'  },
  }

  return (
    <section className="mt-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
        <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-500/50">
          {t('work.case.label')}
        </p>
      </div>

      <motion.h2
        className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl mb-10"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {t('work.case.title')}
      </motion.h2>

      {/* Rows */}
      <div className="space-y-0">
        {rows.map((row, i) => {
          const cfg = accentColor[row.accent as keyof typeof accentColor]
          return (
            <motion.div
              key={row.label}
              className="group border-t py-8 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 md:gap-10 hover:bg-[rgba(6,182,212,0.02)] transition-colors duration-300"
              style={{ borderColor: 'rgba(120,130,180,0.1)' }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
            >
              {/* Left: label + number */}
              <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-1">
                <span className="font-mono text-[9px] tracking-widest" style={{ color: cfg.text, opacity: 0.4 }}>
                  {row.num}
                </span>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {row.label}
                </h3>
              </div>

              {/* Right: content */}
              <div className="flex gap-4">
                {/* Accent bar */}
                <div
                  className="hidden md:block w-px shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to bottom, ${cfg.text}, transparent)`, height: '100%' }}
                />
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-[rgba(180,190,220,0.7)]">
                  {row.value}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      <motion.div
        className="mt-10 flex flex-wrap gap-3 pt-8 border-t"
        style={{ borderColor: 'rgba(120,130,180,0.1)' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <Link to={ROUTES.CONTACT} className="btn-cyber-primary focus-ring inline-flex items-center gap-2">
          {t('home.contact.cta')} →
        </Link>
        <Link to={ROUTES.PRICING} className="btn-cyber-outline focus-ring inline-flex items-center gap-2">
          {t('about.ctaPricing')} →
        </Link>
      </motion.div>
    </section>
  )
}

/* ── Main page ────────────────────────────────────── */
export default function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const { item, loading, error, notFound } = useSlugDetail<Work>(getWorkDetail, slug)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <div>
      {/* ── Loading / error states ──────────────────── */}
      {(loading || error || notFound) && (
        <div className="mx-auto max-w-5xl px-4 py-20">
          <Link
            to={ROUTES.WORKS}
            className="mb-8 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-500/50 hover:text-cyan-400 transition-colors"
          >
            ← {t('detail.backToList')}
          </Link>
          {loading && <SkeletonDetail />}
          {error && <ErrorState message={error} />}
          {notFound && <NotFoundState backTo={ROUTES.WORKS} />}
        </div>
      )}

      {item && (
        <ContentAccessGuard item={item}>
          <PageHead
            title={item.title}
            description={item.description ? truncateForDescription(item.description) : undefined}
            ogImage={getMediaUrl(item.thumbnail) ?? undefined}
            ogType="article"
          />

          {/* ── Full-screen hero image ──────────────── */}
          {item.thumbnail && (
            <div ref={heroRef} className="relative h-[70vh] overflow-hidden">
              <motion.div style={{ scale: heroScale }} className="h-full w-full">
                <img
                  src={getMediaUrl(item.thumbnail, 'large') ?? getMediaUrl(item.thumbnail)!}
                  alt={item.thumbnail.alternativeText ?? item.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(6,6,15,0.3)] to-[rgba(6,6,15,0.85)]" />

              {/* Cyber grid overlay */}
              <div className="cyber-grid pointer-events-none absolute inset-0 opacity-20" />

              {/* Hero meta */}
              <motion.div
                style={{ opacity: heroOpacity }}
                className="absolute bottom-0 left-0 right-0 px-4 pb-12 md:px-8 md:pb-16"
              >
                <div className="mx-auto max-w-5xl">
                  {/* Back link */}
                  <Link
                    to={ROUTES.WORKS}
                    className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-400/60 hover:text-cyan-400 transition-colors"
                  >
                    ← {t('detail.backToList')}
                  </Link>

                  {/* Badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {item.isFeatured && <Badge variant="featured" />}
                    {item.accessStatus === 'fc_only' && <Badge variant="fc" />}
                    {item.accessStatus === 'limited' && <Badge variant="limited" />}
                    {item.category && (
                      <span className="cyber-tag">{item.category}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
                    <SplitWords text={item.title} staggerMs={35} wordClassName="text-white" />
                  </h1>

                  {/* Meta */}
                  {item.publishAt && (
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {formatDate(item.publishAt)}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Corner marks */}
              <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-cyan-400/20" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-cyan-400/20" />
            </div>
          )}

          {/* ── Article ────────────────────────────── */}
          <div className="mx-auto max-w-5xl px-4 py-16">
            {/* Back link when no thumbnail */}
            {!item.thumbnail && (
              <Link
                to={ROUTES.WORKS}
                className="mb-10 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-500/50 hover:text-cyan-400 transition-colors"
              >
                ← {t('detail.backToList')}
              </Link>
            )}

            {/* Header when no hero image */}
            {!item.thumbnail && (
              <motion.header
                className="mb-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {item.isFeatured && <Badge variant="featured" />}
                  {item.accessStatus === 'fc_only' && <Badge variant="fc" />}
                  {item.accessStatus === 'limited' && <Badge variant="limited" />}
                  {item.category && <span className="cyber-tag">{item.category}</span>}
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl">
                  {item.title}
                </h1>
                {item.publishAt && (
                  <p className="mt-3 font-mono text-[10px] text-[rgba(6,182,212,0.4)] uppercase tracking-widest">
                    {formatDate(item.publishAt)}
                  </p>
                )}
              </motion.header>
            )}

            <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_280px]">
              {/* Main body */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {item.description && (
                  <div className="whitespace-pre-wrap text-base leading-8 text-gray-700 dark:text-[rgba(180,190,220,0.75)]">
                    {item.description}
                  </div>
                )}

                {item.externalUrl && (
                  <div className="mt-8">
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cyber-primary focus-ring inline-flex items-center gap-2"
                    >
                      View project
                      <span className="font-mono text-xs opacity-70">↗</span>
                    </a>
                  </div>
                )}
              </motion.div>

              {/* Sidebar meta */}
              <motion.aside
                className="hidden md:block"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.35 }}
              >
                <div className="sticky top-24 space-y-6 glass-cyber p-5">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/40 mb-3">
                      // meta
                    </p>
                    <dl className="space-y-3">
                      {item.category && (
                        <div>
                          <dt className="font-mono text-[9px] uppercase tracking-widest text-[rgba(120,140,180,0.5)]">category</dt>
                          <dd className="mt-0.5 font-mono text-xs text-cyan-400/70">{item.category}</dd>
                        </div>
                      )}
                      {item.publishAt && (
                        <div>
                          <dt className="font-mono text-[9px] uppercase tracking-widest text-[rgba(120,140,180,0.5)]">date</dt>
                          <dd className="mt-0.5 font-mono text-xs text-cyan-400/70">{formatDate(item.publishAt)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="pt-4 border-t border-[rgba(6,182,212,0.1)]">
                    <Link
                      to={ROUTES.WORKS}
                      className="font-mono text-[9px] uppercase tracking-widest text-cyan-500/40 hover:text-cyan-400 transition-colors"
                    >
                      ← all works
                    </Link>
                  </div>
                </div>
              </motion.aside>
            </div>

            <CaseStudySection item={item} />
          </div>
        </ContentAccessGuard>
      )}
    </div>
  )
}
