import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import ErrorState from '@/components/common/ErrorState'
import SkeletonListItem from '@/components/common/SkeletonListItem'
import MemberProgressHub from '@/components/common/MemberProgressHub'
import CampaignPersonalizationPanel from '@/components/common/CampaignPersonalizationPanel'
import { useCurrentUser, useStrapiCollection } from '@/hooks'
import { resolveBenefitExperienceState } from '@/lib/auth/benefitState'
import { buildBenefitPresentation } from '@/lib/auth/benefitPresentation'
import { resolveCampaignPersonalizationState } from '@/lib/auth/campaignPersonalizationState'
import { getFaqList } from '@/modules/faq/api'
import { getGuideList } from '@/modules/faq/guideApi'
import { ROUTES } from '@/lib/routeConstants'
import { isFanclubSite, isMainSite, isStoreSite } from '@/lib/siteLinks'
import type { FAQItem, GuideItem, SourceSite } from '@/types'
import { siteScopedCategories } from '@/modules/support/config'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import { getMySupportHistory, getMySupportSummary, reopenSupportCase, type SupportCaseHistoryItem, type SupportCaseSummary } from '@/modules/support/caseApi'
import { getPublicStatusSummary, type PublicStatusResponse } from '@/modules/status/api'
import StatusNoticePanel from '@/modules/status/components/StatusNoticePanel'

const detectSite = (): SourceSite => {
  if (isStoreSite) return 'store'
  if (isFanclubSite) return 'fc'
  if (isMainSite) return 'main'
  return 'all'
}

const SUPPORT_HISTORY_PAGE_SIZE = Number(import.meta.env.VITE_SUPPORT_CENTER_HISTORY_PAGE_SIZE ?? 6)
const SUPPORT_SUGGESTION_MAX = Number(import.meta.env.VITE_SUPPORT_CENTER_SUGGESTION_MAX ?? 4)

export default function SupportCenterPage() {
  const { t } = useTranslation()
  const { user, lifecycle, isSignedIn } = useCurrentUser()
  const auth = useAuthClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [caseSummary, setCaseSummary] = useState<SupportCaseSummary | null>(null)
  const [caseHistory, setCaseHistory] = useState<SupportCaseHistoryItem[]>([])
  const [caseLoading, setCaseLoading] = useState(false)
  const [caseError, setCaseError] = useState<string | null>(null)
  const [statusSummary, setStatusSummary] = useState<PublicStatusResponse['publicStatusSummary'] | null>(null)
  const site = detectSite()
  const sourceSite = site === 'all' ? 'main' : site
  const benefitState = resolveBenefitExperienceState({ user, lifecycle, sourceSite })
  const benefitPresentation = buildBenefitPresentation(benefitState)
  const campaignState = resolveCampaignPersonalizationState({ user, lifecycle, sourceSite: 'support' })

  const { items: faqs, loading: faqLoading, error: faqError, refetch: refetchFaq } = useStrapiCollection<FAQItem>(() => getFaqList())
  const { items: guides, loading: guideLoading, error: guideError, refetch: refetchGuide } = useStrapiCollection<GuideItem>(() => getGuideList())

  const categories = useMemo(() => [{ key: 'all', label: t('support.filters.all') }, ...siteScopedCategories(site).map((item) => ({ key: item.key, label: t(item.labelKey) }))], [site, t])

  const quickLinks = useMemo(() => {
    if (site === 'store') {
      return [
        { to: '/guide', label: t('support.quickLinks.storeGuide') },
        { to: '/shipping-policy', label: t('support.quickLinks.shipping') },
        { to: '/returns', label: t('support.quickLinks.returns') },
        { to: '/legal', label: t('support.quickLinks.legal') },
      ]
    }
    if (site === 'fc') {
      return [
        { to: '/guide', label: t('support.quickLinks.fcGuide') },
        { to: '/subscription-policy', label: t('support.quickLinks.subscription') },
        { to: '/legal', label: t('support.quickLinks.legal') },
        { to: '/faq', label: t('support.quickLinks.faq') },
      ]
    }
    return [
      { to: '/faq', label: t('support.quickLinks.faq') },
      { to: '/events', label: t('support.quickLinks.events') },
      { to: '/news', label: t('support.quickLinks.news') },
      { to: '/legal/privacy-policy', label: t('support.quickLinks.privacy') },
    ]
  }, [site, t])

  const filteredFaqs = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return (faqs ?? []).filter((item) => {
      if (item.sourceSite !== 'all' && item.sourceSite !== site) return false
      if (category !== 'all' && item.category !== category && item.subcategory !== category) return false
      if (!keyword) return item.isPublic !== false
      const text = [item.question, item.answer, ...(item.tags ?? []), ...(item.keywords ?? [])].join(' ').toLowerCase()
      return text.includes(keyword)
    })
  }, [faqs, site, category, search])

  const filteredGuides = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return (guides ?? []).filter((item) => {
      if (item.sourceSite !== 'all' && item.sourceSite !== site) return false
      if (category !== 'all' && item.category !== category) return false
      if (!keyword) return true
      const text = [item.title, item.summary ?? '', item.body ?? '', ...(item.tags ?? [])].join(' ').toLowerCase()
      return text.includes(keyword)
    })
  }, [guides, site, category, search])

  const featuredFaqs = useMemo(() => filteredFaqs.filter((item) => item.featured).slice(0, 3), [filteredFaqs])
  const featuredGuides = useMemo(() => filteredGuides.filter((item) => item.featured).slice(0, 3), [filteredGuides])
  const recentGuides = useMemo(
    () => [...filteredGuides].sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))).slice(0, 4),
    [filteredGuides],
  )

  const hasResults = filteredFaqs.length > 0 || filteredGuides.length > 0
  const articleSuggestions = useMemo(() => {
    const topFaq = filteredFaqs.slice(0, 2).map((item) => ({ title: item.question, to: ROUTES.FAQ }))
    const topGuide = filteredGuides.slice(0, 2).map((item) => ({ title: item.title, to: ROUTES.SUPPORT_GUIDE_DETAIL.replace(':slug', item.slug) }))
    return [...topFaq, ...topGuide].slice(0, SUPPORT_SUGGESTION_MAX)
  }, [filteredFaqs, filteredGuides])

  useEffect(() => {
    getPublicStatusSummary().then((res) => setStatusSummary(res.publicStatusSummary)).catch(() => setStatusSummary(null))
  }, [])

  useEffect(() => {
    trackMizzzEvent('support_center_view', {
      sourceSite,
      locale: document.documentElement.lang || 'ja',
      membershipStatus: benefitState.membershipStatus,
      lifecycleStage: lifecycle?.lifecycleStage ?? 'guest',
      supportCaseType: category === 'all' ? 'all' : category,
    })
    trackMizzzEvent('help_hub_view', {
      sourceSite,
      supportCaseType: category === 'all' ? 'all' : category,
    })
  }, [sourceSite, benefitState.membershipStatus, lifecycle?.lifecycleStage, category])

  useEffect(() => {
    if (articleSuggestions.length === 0) return
    trackMizzzEvent('article_suggestion_view', {
      sourceSite,
      supportCaseType: category === 'all' ? 'general' : category,
      suggestionCount: articleSuggestions.length,
    })
  }, [articleSuggestions.length, category, sourceSite])

  useEffect(() => {
    let cancelled = false
    if (!isSignedIn) {
      setCaseSummary(null)
      setCaseHistory([])
      setCaseError(null)
      return
    }
    setCaseLoading(true)
    setCaseError(null)
    void auth.getAccessToken()
      .then(async (token) => {
        if (!token) throw new Error(t('support.case.authRequired'))
        const [summary, history] = await Promise.all([
          getMySupportSummary(token),
          getMySupportHistory(token, 1, SUPPORT_HISTORY_PAGE_SIZE),
        ])
        if (cancelled) return
        setCaseSummary(summary)
        setCaseHistory(history.items)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setCaseError(error instanceof Error ? error.message : t('support.case.loadError'))
      })
      .finally(() => {
        if (!cancelled) setCaseLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [auth, isSignedIn, t])

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <PageHead title={t('support.title')} description={t('support.description')} />

      <div className="mb-6 space-y-4">
        {statusSummary && <StatusNoticePanel summary={statusSummary} />}
        <MemberProgressHub sourceSite="support" />
        <CampaignPersonalizationPanel sourceSite="support" />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.case.title')}</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('support.case.description')}</p>
        {!isSignedIn && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">{t('support.case.signInHint')}</p>
        )}
        {isSignedIn && caseLoading && <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">{t('support.case.loading')}</p>}
        {isSignedIn && caseError && <p className="mt-3 text-sm text-rose-500">{caseError}</p>}
        {isSignedIn && !caseLoading && !caseError && caseSummary && (
          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-100 p-3 text-xs dark:border-gray-800">{t('support.case.openCases')}: <span className="font-semibold">{caseSummary.openCases}</span></div>
              <div className="rounded-xl border border-gray-100 p-3 text-xs dark:border-gray-800">{t('support.case.waitingUser')}: <span className="font-semibold">{caseSummary.waitingUser}</span></div>
              <div className="rounded-xl border border-gray-100 p-3 text-xs dark:border-gray-800">{t('support.case.unresolved')}: <span className="font-semibold">{caseSummary.unresolved}</span></div>
              <div className="rounded-xl border border-gray-100 p-3 text-xs dark:border-gray-800">{t('support.case.selfResolved')}: <span className="font-semibold">{caseSummary.selfResolved}</span></div>
            </div>
            <ul className="mt-4 space-y-2">
              {caseHistory.map((item) => (
                <li key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">#{item.id} · {item.supportCaseType} · {item.sourceSite}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{item.subject || t('support.case.noSubject')}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{t(`support.case.status.${item.caseStatus}`)} / {t(`support.case.resolution.${item.caseResolutionState}`)}</p>
                  {(item.caseStatus === 'resolved' || item.caseStatus === 'closed') && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-violet-600 underline dark:text-violet-300"
                      onClick={() => {
                        void auth.getAccessToken().then((token) => {
                          if (!token) return
                          return reopenSupportCase(token, item.id).then(() => getMySupportHistory(token, 1, SUPPORT_HISTORY_PAGE_SIZE)).then((history) => {
                            setCaseHistory(history.items)
                            trackMizzzEvent('case_reopen_click', { sourceSite, caseStatus: item.caseStatus, supportCaseType: item.supportCaseType })
                          })
                        })
                      }}
                    >
                      {t('support.case.reopen')}
                    </button>
                  )}
                </li>
              ))}
              {caseHistory.length === 0 && <li className="text-sm text-gray-500">{t('support.case.empty')}</li>}
            </ul>
          </>
        )}
      </section>

      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">support center</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{t('support.title')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('support.description')}</p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-violet-400 hover:text-violet-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-300">
              {link.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('support.searchPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none ring-violet-400 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setCategory(item.key)}
              className={`rounded-full border px-3 py-1 text-xs ${category === item.key ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-100' : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.faqSection')}</h2>
            <Link to={ROUTES.FAQ} className="text-xs text-violet-500 hover:text-violet-400">{t('support.seeAllFaq')}</Link>
          </div>
          {faqLoading && <SkeletonListItem />}
          {faqError && <ErrorState message={faqError} onRetry={refetchFaq} location="support_center_faq" />}
          {!faqLoading && !faqError && (
            <ul className="space-y-3">
              {filteredFaqs.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.question}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-300 line-clamp-2">{item.answer}</p>
                </li>
              ))}
              {filteredFaqs.length === 0 && <li className="text-sm text-gray-500">{t('support.emptyFaq')}</li>}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.guideSection')}</h2>
            <Link to={ROUTES.SUPPORT_CENTER} className="text-xs text-violet-500 hover:text-violet-400">{t('support.seeAllGuides')}</Link>
          </div>
          {guideLoading && <SkeletonListItem />}
          {guideError && <ErrorState message={guideError} onRetry={refetchGuide} location="support_center_guide" />}
          {!guideLoading && !guideError && (
            <ul className="space-y-3">
              {filteredGuides.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <Link to={ROUTES.SUPPORT_GUIDE_DETAIL.replace(':slug', item.slug)} className="text-sm font-medium text-gray-800 hover:text-violet-500 dark:text-gray-100">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-300 line-clamp-2">{item.summary ?? ''}</p>
                </li>
              ))}
              {filteredGuides.length === 0 && <li className="text-sm text-gray-500">{t('support.emptyGuide')}</li>}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5 dark:border-cyan-800 dark:bg-cyan-950/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.selfService.title')}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('support.selfService.description')}</p>
        <ul className="mt-3 space-y-2">
          {articleSuggestions.map((item, index) => (
            <li key={`${item.to}-${index}`}>
              <Link
                to={item.to}
                className="text-sm text-cyan-700 underline dark:text-cyan-300"
                onClick={() => trackMizzzEvent('article_suggestion_click', { sourceSite, supportCaseType: category === 'all' ? 'general' : category })}
              >
                {item.title}
              </Link>
            </li>
          ))}
          {articleSuggestions.length === 0 && <li className="text-sm text-gray-500">{t('support.selfService.empty')}</li>}
        </ul>
        <Link
          to={ROUTES.CONTACT}
          className="mt-4 inline-flex rounded-full border border-cyan-300 px-3 py-1 text-xs text-cyan-800 dark:border-cyan-700 dark:text-cyan-300"
          onClick={() => trackMizzzEvent('still_need_help_click', { sourceSite, supportCaseType: category === 'all' ? 'general' : category })}
        >
          {t('support.selfService.stillNeedHelp')}
        </Link>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.featuredSection')}</h2>
          <ul className="mt-4 space-y-2">
            {featuredFaqs.map((item) => (
              <li key={`featured-faq-${item.id}`} className="rounded-xl border border-gray-100 p-3 text-sm dark:border-gray-800">
                <p className="font-medium text-gray-800 dark:text-gray-100">{item.question}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-300">{item.answer}</p>
              </li>
            ))}
            {featuredGuides.map((item) => (
              <li key={`featured-guide-${item.id}`} className="rounded-xl border border-gray-100 p-3 text-sm dark:border-gray-800">
                <Link to={ROUTES.SUPPORT_GUIDE_DETAIL.replace(':slug', item.slug)} className="font-medium text-gray-800 hover:text-violet-500 dark:text-gray-100">
                  {item.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-300">{item.summary ?? ''}</p>
              </li>
            ))}
            {featuredFaqs.length + featuredGuides.length === 0 && <li className="text-sm text-gray-500">{t('support.emptyFeatured')}</li>}
          </ul>
        </section>

        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.recentSection')}</h2>
          <ul className="mt-4 space-y-2">
            {recentGuides.map((item) => (
              <li key={`recent-guide-${item.id}`} className="rounded-xl border border-gray-100 p-3 text-sm dark:border-gray-800">
                <Link to={ROUTES.SUPPORT_GUIDE_DETAIL.replace(':slug', item.slug)} className="font-medium text-gray-800 hover:text-violet-500 dark:text-gray-100">
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{item.summary ?? ''}</p>
              </li>
            ))}
            {recentGuides.length === 0 && <li className="text-sm text-gray-500">{t('support.emptyRecent')}</li>}
          </ul>
        </section>
      </div>

      {!hasResults && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/70 dark:bg-amber-950/10">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t('support.noResultsTitle')}</h3>
          <p className="mt-2 text-sm text-amber-800/80 dark:text-amber-300/80">{t('support.noResultsDescription')}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategory('all')
              }}
              className="rounded-full border border-amber-300 px-3 py-1 text-xs text-amber-800 hover:border-amber-500 dark:border-amber-700 dark:text-amber-300"
            >
              {t('support.resetFilters')}
            </button>
            <Link to={ROUTES.CONTACT} className="rounded-full border border-violet-300 px-3 py-1 text-xs text-violet-700 hover:border-violet-500 dark:border-violet-700 dark:text-violet-300">
              {t('support.toContact')}
            </Link>
          </div>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-violet-200 bg-violet-50/40 p-5 dark:border-violet-800 dark:bg-violet-950/20">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('support.beforeContactTitle')}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('support.beforeContactDescription')}</p>
        <div className="mt-3 rounded-xl border border-violet-200/80 bg-white/80 p-3 text-xs text-violet-900 dark:border-violet-900/60 dark:bg-gray-950/40 dark:text-violet-100">
          <p className="font-semibold">{benefitPresentation.title}</p>
          <p className="mt-1">{benefitPresentation.description}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              to={ROUTES.MEMBER}
              onClick={() => {
                trackMizzzEvent('support_from_benefit_state', {
                  sourceSite,
                  membershipStatus: benefitState.membershipStatus,
                  entitlementState: benefitState.entitlementState,
                  benefitVisibilityState: benefitState.benefitVisibilityState,
                  accessGateState: benefitState.accessGateState,
                  earlyAccessState: benefitState.earlyAccessState,
                  cta: benefitPresentation.primaryAction,
                })
                trackMizzzEvent('support_from_campaign_state', {
                  sourceSite,
                  membershipStatus: campaignState.membershipStatus,
                  lifecycleStage: campaignState.lifecycleStage,
                  campaignEligibilityState: campaignState.campaignEligibilityState,
                  seasonalEligibilityState: campaignState.seasonalEligibilityState,
                  recommendationState: campaignState.recommendationState,
                })
              }}
              className="text-violet-700 underline dark:text-violet-300"
            >
              {t('memberValue.openBenefitHub', { defaultValue: 'マイページで特典を確認' })}
            </Link>
          </div>
        </div>
        <Link to={ROUTES.CONTACT} className="mt-3 inline-flex text-sm text-violet-600 hover:text-violet-500 dark:text-violet-300">
          {t('support.toContact')}
        </Link>
      </div>
    </section>
  )
}
