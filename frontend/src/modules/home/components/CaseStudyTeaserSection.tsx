import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { ROUTES, detailPath } from '@/lib/routeConstants'
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

export default function CaseStudyTeaserSection() {
  const { t } = useTranslation()
  const { items, loading } = useStrapiCollection<Work>(() =>
    getWorksList({ pagination: { pageSize: 8 } }),
  )

  const works = items ?? []
  const target = works.find(hasCaseStudy) ?? works.find((item) => item.isFeatured) ?? works[0]

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20 border-t border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {t('home.caseStudy.label')}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {t('home.caseStudy.title')}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {t('home.caseStudy.body')}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to={ROUTES.PRICING}
            className="inline-flex items-center border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500"
          >
            {t('about.ctaPricing')}
          </Link>
          <Link
            to={ROUTES.CONTACT}
            className="inline-flex items-center bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-700 dark:hover:bg-gray-100"
          >
            {t('home.contact.cta')}
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-gray-100 dark:border-gray-800 p-5">
        {loading && <p className="font-mono text-xs text-gray-400">{t('common.loading')}</p>}
        {!loading && target && (
          <>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">featured case</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{target.title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {target.caseStudyGoal ?? target.description ?? t('home.caseStudy.fallback')}
            </p>
            <Link
              to={detailPath.work(target.slug)}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {t('home.caseStudy.view')} →
            </Link>
          </>
        )}
        {!loading && !target && (
          <p className="text-sm text-gray-400 dark:text-gray-600">{t('home.caseStudy.empty')}</p>
        )}
      </div>
    </motion.section>
  )
}
