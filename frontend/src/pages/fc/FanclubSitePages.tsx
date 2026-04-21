import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import DailyMessageCard from '@/modules/playful/components/DailyMessageCard'
import WeeklyPickupCard from '@/modules/playful/components/WeeklyPickupCard'
import SurpriseCard from '@/modules/playful/components/SurpriseCard'
import HiddenQuote from '@/modules/playful/components/HiddenQuote'
import MemberPlayfulBlock from '@/modules/playful/components/MemberPlayfulBlock'
import EasterEggTrigger from '@/modules/playful/components/EasterEggTrigger'
import { getSiteSettings } from '@/modules/settings/api'
import { getFanclubList } from '@/modules/fanclub/api'
import { createSectionVisibilityResolver, isWithinPublicationWindow, parseTopPageSections } from '@/lib/editorial'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import SeoInternalLinkSection from '@/components/common/SeoInternalLinkSection'
import { ROUTES } from '@/lib/routeConstants'
import { useCurrentUser, useStrapiCollection, useStrapiSingle } from '@/hooks'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import { HAS_AUTH } from '@/lib/auth/config'
import { canAccessByRole, type VisibilityScope } from '@/lib/auth/membership'
import { trackCtaClick } from '@/modules/analytics/tracking'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { storeLink } from '@/lib/siteLinks'
import UpdateDigestSection, { type UpdateDigestItem } from '@/components/common/UpdateDigestSection'
import EditorialSpotlightSection from '@/components/common/EditorialSpotlightSection'
import CampaignHero from '@/modules/campaign/components/CampaignHero'
import { getCampaignList } from '@/modules/campaign/api'
import type { CampaignSummary } from '@/modules/campaign/types'
import { isCampaignActive } from '@/modules/campaign/lib'
import NotificationInterestButton from '@/modules/notifications/components/NotificationInterestButton'
import NotificationSettingsPanel from '@/modules/notifications/components/NotificationSettingsPanel'
import { createCustomerPortalSession, createFanclubCheckoutSession } from '@/modules/payments/api'
import { getMembershipPlans } from '@/modules/payments/plans'
import type { MembershipPlan } from '@/modules/payments/types'
import BrandIllustration from '@/components/common/BrandIllustration'
import Button from '@/components/common/ui/Button'
import SemanticBadge from '@/components/common/ui/SemanticBadge'
import SectionReveal from '@/components/common/SectionReveal'
import CuratedBentoSection from '@/components/common/CuratedBentoSection'
import VisualHeroSection from '@/components/common/VisualHeroSection'
import ExperienceHighlightsSection from '@/components/common/ExperienceHighlightsSection'
import HeroImageSlider, { type HeroSlide } from '@/components/common/HeroImageSlider'
import ImageFeatureTile from '@/components/common/ImageFeatureTile'
import { normalizeHeroSlides } from '@/lib/heroSlides'
import { getMediaUrl } from '@/utils'
import type { FanclubContent } from '@/types'
import { useSeasonalTheme } from '@/modules/seasonal/context'

type Visibility = VisibilityScope

interface FcItem {
  slug: string
  title: string
  description: string
  publishAt: string
  visibility: Visibility
}

const MOVIES: FcItem[] = [
  { slug: 'studio-session-01', title: 'Studio Session 01', description: '制作中の断片を収めた会員限定クリップ。', publishAt: '2026-04-01', visibility: 'members' },
  { slug: 'letter-to-members', title: 'Letter to Members', description: '今月のメッセージ動画。', publishAt: '2026-03-20', visibility: 'public' },
]

const GALLERIES: FcItem[] = [
  { slug: 'offshot-2026-spring', title: 'Offshot / Spring 2026', description: '制作現場のオフショット。', publishAt: '2026-03-30', visibility: 'members' },
  { slug: 'artwork-select', title: 'Artwork Select', description: '公開アートワークギャラリー。', publishAt: '2026-02-18', visibility: 'public' },
]

const TICKETS: FcItem[] = [
  { slug: 'live-2026-tokyo-preorder', title: 'LIVE 2026 TOKYO 先行受付', description: '会員先行チケットの受付情報。', publishAt: '2026-04-04', visibility: 'members' },
]

function FcSectionTemplate({
  title,
  description,
  items,
  detailBase,
}: {
  title: string
  description: string
  items: FcItem[]
  detailBase: string
}) {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const role = user?.role ?? 'guest'
  useEffect(() => {
    trackCtaClick('fc_section', 'view', { section: title, loggedIn: role !== 'guest' })
  }, [role, title])

  const accessLabel: Record<Visibility, string> = {
    public: t('fanclub.accessPublic'),
    members: t('fanclub.accessMembers'),
    premium: t('fanclub.accessPremium'),
  }

  return (
    <section className="ds-container py-12 sm:py-16">
      <PageHead title={`${title} | mizzz official fanclub`} description={description} noindex />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">{t('fanclub.archive')}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const isLocked = !canAccessByRole(role, item.visibility)
          return (
            <article key={item.slug} className="group rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300/80 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-gray-700">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-gray-400 dark:text-gray-500">{item.publishAt}</p>
                <SemanticBadge tone={isLocked ? 'neutral' : 'members'} className="text-[11px]">
                  {isLocked ? `🔒 ${accessLabel[item.visibility]}` : accessLabel[item.visibility]}
                </SemanticBadge>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900 transition-colors group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              <div className="mt-5">
                {isLocked ? (
                  <Button to={ROUTES.FC_JOIN} variant="accent" size="sm" onClick={() => trackCtaClick('fc_section', 'join_from_locked', { title: item.title, section: title })}>{t('fanclub.joinToView')}</Button>
                ) : (
                  <Button to={`${detailBase}/${item.slug}`} variant="ghost" size="sm" onClick={() => trackCtaClick('fc_section', 'content_detail', { slug: item.slug, section: title })}>{t('common.viewDetails')}</Button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function FanclubHomeHubPage() {
  const { i18n, t } = useTranslation()
  const { resolution, config } = useSeasonalTheme()
  const { products } = useProductList(8)
  const { items: campaigns } = useStrapiCollection<CampaignSummary>(() => getCampaignList())
  const { item: settings } = useStrapiSingle(() => getSiteSettings({
    locale: i18n.resolvedLanguage,
  }))
  const { items: weeklyContent } = useStrapiCollection<FanclubContent>(() => getFanclubList({
    locale: i18n.resolvedLanguage,
    filters: { weeklyHighlight: { $eq: true } },
    pagination: { pageSize: 6, withCount: false },
  }))
  const storeBenefits = useMemo(() => products.filter((item) => item.earlyAccess || item.memberBenefit || item.accessStatus === 'fc_only').slice(0, 3), [products])
  const sectionResolver = useMemo(() => createSectionVisibilityResolver(
    parseTopPageSections(settings?.topPageSections),
    'fanclub',
    i18n.resolvedLanguage,
  ), [i18n.resolvedLanguage, settings?.topPageSections])

  const activeWeeklyContent = useMemo(() => (weeklyContent ?? [])
    .filter((item) => isWithinPublicationWindow({ startAt: item.startAt, endAt: item.endAt }))
    .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))
    .slice(0, 3), [weeklyContent])
  const memberCampaign = useMemo(
    () =>
      (campaigns ?? [])
        .filter((item) => item.membersOnly || item.earlyAccess)
        .filter((item) => isCampaignActive(item))
        .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))[0] ?? null,
    [campaigns],
  )
  const homeDigestItems = useMemo<UpdateDigestItem[]>(() => {
    const next: UpdateDigestItem[] = activeWeeklyContent.map((item) => ({
      id: `weekly-${item.id}`,
      title: `今週更新: ${item.title}`,
      description: item.shortHighlight ?? item.heroCopy ?? '会員向け更新を公開しました。',
      href: `/fanclub/${item.slug}`,
      tone: 'members',
      location: 'fc_home_digest',
    }))

    next.push({
      id: 'early-store',
      title: 'FC向け先行販売情報',
      description: '会員向け販売・先行案内をストア連携で確認。',
      href: storeLink('/products'),
      tone: 'early',
      location: 'fc_home_digest',
    })
    next.push({
      id: 'join-value',
      title: '継続特典と次回更新を確認',
      description: 'マイページで次に見るべき内容を迷わずチェック。',
      href: ROUTES.FC_MYPAGE,
      tone: 'important',
      location: 'fc_home_digest',
    })

    return next.slice(0, 3)
  }, [activeWeeklyContent])
  const fanclubSpotlights = useMemo(
    () => [
      {
        id: 'fc-weekly-update',
        eyebrow: 'THIS WEEK',
        title: '今週の更新をまとめてチェック',
        description: 'Movies / Gallery / Tickets の限定更新を1画面で確認できます。',
        href: ROUTES.FC_MYPAGE,
        ctaLabel: 'マイページへ',
        tone: 'member' as const,
        trackingLocation: 'fc_home_spotlight',
      },
      {
        id: 'fc-campaign',
        eyebrow: 'LIMITED BENEFIT',
        title: '会員向け先行・特典導線',
        description: '限定販売・先行販売の情報をストア連携で見逃さず確認。',
        href: storeLink('/products'),
        ctaLabel: '特典を見る',
        tone: 'campaign' as const,
        trackingLocation: 'fc_home_spotlight',
      },
      {
        id: 'fc-join-guide',
        eyebrow: 'JOIN FLOW',
        title: '入会後に迷わない導線設計',
        description: 'join → login → mypage の流れをシンプルに案内します。',
        href: ROUTES.FC_JOIN,
        ctaLabel: '入会フローへ',
        tone: 'default' as const,
        trackingLocation: 'fc_home_spotlight',
      },
    ],
    [],
  )
  const homeBentoItems = useMemo(
    () => [
      {
        id: 'fc-weekly',
        title: '今週の更新を先頭で確認',
        description: '動画・ギャラリー・先行情報の更新を毎週まとめて確認できます。',
        href: ROUTES.FC_MYPAGE,
        label: 'WEEKLY UPDATE',
        accent: 'fuchsia' as const,
        location: 'fc_home_bento',
        action: 'weekly',
        className: 'sm:col-span-2 lg:col-span-3',
      },
      {
        id: 'fc-join',
        title: '入会フローをシンプルに',
        description: 'join / login / mypage まで最短で迷わず遷移できる設計。',
        href: ROUTES.FC_JOIN,
        label: 'JOIN FLOW',
        accent: 'violet' as const,
        location: 'fc_home_bento',
        action: 'join',
      },
      {
        id: 'fc-store',
        title: '会員向けストア連携',
        description: '先行販売や会員特典つき商品への導線を統合。',
        href: storeLink('/products'),
        label: 'MEMBER STORE',
        accent: 'sky' as const,
        location: 'fc_home_bento',
        action: 'member_store',
      },
      {
        id: 'fc-legal',
        title: '法務・安心導線',
        description: '規約、プライバシー、継続課金ポリシーを見失わない設計。',
        href: ROUTES.FC_LEGAL,
        label: 'SAFE MEMBERSHIP',
        accent: 'amber' as const,
        location: 'fc_home_bento',
        action: 'legal',
      },
    ],
    [],
  )

  const fcHeroSlides: HeroSlide[] = useMemo(() => {
    const fromCms = normalizeHeroSlides((settings as unknown as { heroSlides?: unknown })?.heroSlides)
    if (fromCms.length) return fromCms
    const heroImage = getMediaUrl(settings?.fcHeroImage ?? null, 'large')
    const heroImageMobile = getMediaUrl(settings?.fcHeroImageMobile ?? null, 'large')
    return [
      {
        id: 'fc-hero-default',
        image: heroImage,
        mobileImage: heroImageMobile ?? heroImage,
        eyebrow: 'OFFICIAL FANCLUB',
        featuredLabel: 'MEMBERS ONLY',
        title: settings?.heroTitle?.trim() || t('seasonal.fc.title', { defaultValue: 'mizzz official fanclub' }),
        description: settings?.heroCopy?.trim() || t('seasonal.fc.description', { defaultValue: '限定ニュース、ブログ、動画、ギャラリー、イベント先行情報を、余白と静けさを保ちながら届けるメンバーシップサイトです。' }),
        ctaLabel: settings?.heroCTALabel?.trim() || '入会する',
        ctaHref: settings?.heroCTAUrl?.trim() || ROUTES.FC_JOIN,
        secondaryCtaLabel: 'ログイン',
        secondaryCtaHref: ROUTES.FC_LOGIN,
        overlay: 'editorial',
        align: 'left',
      },
    ]
  }, [settings, t])

  return (
    <section className="ds-container py-10 md:py-16">
      <PageHead
        title={settings?.heroTitle?.trim() || t('seasonal.fc.title', { defaultValue: 'mizzz official fanclub' })}
        description="mizzz の公式ファンクラブ。ニュース、ブログ、動画、ギャラリー、チケット先行情報を会員向けに配信。"
      />

      <StructuredData
        schema={{
          type: 'CollectionPage',
          name: 'mizzz official fanclub',
          url: 'https://fc.mizzz.jp/',
          description: 'join / guide / faq / members update の導線を持つファンクラブハブ',
        }}
      />
      <StructuredData
        schema={{
          type: 'BreadcrumbList',
          items: [
            { name: 'mizzz official fanclub', url: 'https://fc.mizzz.jp/' },
          ],
        }}
      />


      <SeoInternalLinkSection
        title="fanclub 回遊ハブ"
        description="一般公開ページと会員向けページを分離しつつ、入会・継続・サポート導線を明確化します。"
        items={[
          { href: ROUTES.FC_JOIN, title: '入会', description: '料金・特典・登録フローを確認。' },
          { href: ROUTES.FC_GUIDE, title: 'Guide', description: '入会後の使い方・トラブル解決手順。' },
          { href: ROUTES.FAQ, title: 'FAQ', description: '決済・公開範囲・解約のよくある質問。' },
          { href: ROUTES.FC_ABOUT, title: 'ファンクラブ概要', description: '提供価値と更新方針を把握。' },
          { href: storeLink('/products'), title: '会員向けストア連携', description: '先行販売・会員特典の導線へ。' },
          { href: ROUTES.FC_LEGAL, title: '法務ガイド', description: '継続課金・規約・プライバシーを確認。' },
        ]}
      />

      {/* FC ヒーロー画像スライダー — CMS heroSlides または fcHeroImage で差し替え可能 */}
      <HeroImageSlider
        slides={fcHeroSlides}
        aspectRatio="16/9"
        mobileAspectRatio="4/5"
        locationTag="fc_home_hero_slider"
        onCtaClick={(slideIndex, kind) =>
          trackCtaClick('fc_home_hero_slider', `${kind}_slide_${slideIndex}`, {
            slide: String(fcHeroSlides[slideIndex]?.id ?? slideIndex),
          })
        }
      />

      <VisualHeroSection
        location="fc_home"
        eyebrow="OFFICIAL FANCLUB"
        badge={settings?.heroSubcopy?.trim() || t('seasonal.heroBadgeMembers', { defaultValue: 'members only / weekly / limited' })}
        title={settings?.heroTitle?.trim() || t('seasonal.fc.title', { defaultValue: 'mizzz official fanclub' })}
        description={settings?.heroCopy?.trim() || t('seasonal.fc.description', { defaultValue: '限定ニュース、ブログ、動画、ギャラリー、イベント先行情報を、余白と静けさを保ちながら届けるメンバーシップサイトです。' })}
        seasonalTitle={t(`seasonal.theme.${resolution.theme}`)}
        illustrationVariant={config.illustrationVariant}
        backgroundVariant="fanclub"
        actions={[
          { label: settings?.heroCTALabel?.trim() || '入会する', to: settings?.heroCTAUrl?.trim() || ROUTES.FC_JOIN, cta: 'join', style: 'primary' },
          { label: 'ログイン', to: ROUTES.FC_LOGIN, cta: 'login', style: 'secondary' },
          { label: '会員向けストアを見る', to: storeLink(ROUTES.STORE_HOME), cta: 'to_store', style: 'accent' },
          { label: 'FAQ', to: ROUTES.FAQ, cta: 'faq', style: 'secondary' },
        ]}
        metrics={[
          { label: '会員特典', value: '先行案内 / FC限定公開 / 会員向け販売導線' },
          { label: '料金', value: '月額 880円 / 年額 8,800円' },
          { label: '今週の更新', value: '動画・ブログ・イベント情報を順次公開' },
          { label: '限定特典', value: '先行案内 / FC限定公開 / 会員向け販売導線' },
          { label: 'FAQ', value: '入会・解約・公開範囲の案内を常設' },
        ]}
      />


      <ExperienceHighlightsSection
        site="fanclub"
        title={t('experience.fc.title', { defaultValue: '継続したくなる会員体験を、毎週の更新で可視化' })}
        description={t('experience.fc.description', { defaultValue: 'Join / Login / MyPage を迷わず進める設計に加え、限定感と特典価値が見える情報配置へアップデートしました。' })}
        highlights={[
          {
            id: 'fc-highlight-1',
            title: t('experience.fc.highlightWeeklyTitle', { defaultValue: '今週更新を先頭で案内' }),
            description: t('experience.fc.highlightWeeklyDesc', { defaultValue: '再訪時に最初に見るべきコンテンツが即座に把握できます。' }),
          },
          {
            id: 'fc-highlight-2',
            title: t('experience.fc.highlightBenefitTitle', { defaultValue: '会員特典・先行価値を視覚化' }),
            description: t('experience.fc.highlightBenefitDesc', { defaultValue: '限定・先行・会員ストアの導線をカードとCTAで統合。' }),
          },
          {
            id: 'fc-highlight-3',
            title: t('experience.fc.highlightSupportTitle', { defaultValue: '入会前後の不安を減らす支援導線' }),
            description: t('experience.fc.highlightSupportDesc', { defaultValue: 'FAQ / Guide / お問い合わせに迷わず移動できる構成。' }),
          },
        ]}
        ctas={[
          { label: t('subdomain.fanclubNav.join'), to: ROUTES.FC_JOIN },
          { label: t('subdomain.fanclubNav.mypage'), to: ROUTES.FC_MYPAGE, style: 'secondary' },
          { label: t('nav.faq'), to: ROUTES.FAQ, style: 'secondary' },
        ]}
      />

      {sectionResolver('fc-home-weekly-update', true) && <UpdateDigestSection
        title="今週の更新・限定・先行"
        subtitle="再訪時に価値が分かる導線を先頭で確認"
        items={homeDigestItems}
      />}

      {/* 会員向け visual feature — 画像つきで限定感を伝える */}
      {sectionResolver('fc-home-visual-benefit', true) && (() => {
        const subs = (settings?.aboutSubVisuals ?? [])
          .map((m) => getMediaUrl(m, 'medium'))
          .filter((u): u is string => Boolean(u))
        const featured = getMediaUrl(settings?.featuredImage ?? null, 'medium') ?? subs[0] ?? null
        const pickup = getMediaUrl(settings?.pickupImage ?? null, 'medium') ?? subs[1] ?? null
        const campaign = getMediaUrl(settings?.campaignImage ?? null, 'medium') ?? subs[2] ?? null
        return (
          <SectionReveal className="mt-12">
            <div className="mb-5">
              <p className="section-eyebrow mb-1">Members Visual</p>
              <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                会員限定のビジュアル導線
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                限定公開・先行案内・会員特典への導線を画像で整理。
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <ImageFeatureTile
                href={ROUTES.FC_MOVIES}
                image={featured}
                alt="会員限定"
                eyebrow="FC LIMITED"
                title="会員限定コンテンツ"
                description="動画・ブログ・写真を会員向けに段階公開。"
                ctaLabel="限定公開を見る"
                variant="editorial"
                tone="member"
                className="lg:col-span-2"
                onClick={() => trackCtaClick('fc_home_visual_benefit', 'featured_tile')}
              />
              <ImageFeatureTile
                href={storeLink(ROUTES.STORE_HOME)}
                image={pickup}
                alt="会員向けストア"
                eyebrow="EARLY ACCESS"
                title="会員先行ストア"
                description="限定販売・先行購入の導線。"
                ctaLabel="ストアを見る"
                tone="accent"
                onClick={() => trackCtaClick('fc_home_visual_benefit', 'store_tile')}
              />
              <ImageFeatureTile
                href={ROUTES.FC_JOIN}
                image={campaign}
                alt="入会"
                eyebrow="JOIN"
                title="入会して特典を受け取る"
                description="月額 880円 / 年額 8,800円"
                ctaLabel="入会する"
                tone="campaign"
                onClick={() => trackCtaClick('fc_home_visual_benefit', 'join_tile')}
              />
              <ImageFeatureTile
                href={ROUTES.FC_MYPAGE}
                image={subs[3] ?? featured}
                alt="マイページ"
                eyebrow="MY PAGE"
                title="会員ダッシュボード"
                description="更新履歴・特典・継続課金の状況を管理できます。"
                ctaLabel="マイページへ"
                tone="default"
                className="lg:col-span-2"
                onClick={() => trackCtaClick('fc_home_visual_benefit', 'mypage_tile')}
              />
            </div>
          </SectionReveal>
        )
      })()}

      {/* ── playful: 日替わり + 週替わりブロック ─────────── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <DailyMessageCard
          seasonalTheme={resolution.theme}
          location="fc_home_daily"
        />
        <WeeklyPickupCard
          pool={[
            { id: 'fc-w1', label: '今週の会員限定', description: '毎週少しずつ、会員にだけ届けているものがあります。' },
            { id: 'fc-w2', label: '今週の発見', description: 'ゆっくり見ていってください。見つかるものがあるはずです。' },
            { id: 'fc-w3', label: 'This week — members', description: '限定コンテンツの更新を毎週確認できます。' },
            { id: 'fc-w4', label: '週替わりのおすすめ', description: '今週選んだコンテンツを、マイページでまとめて確認できます。' },
          ]}
          location="fc_home_weekly_pickup"
        />
      </div>

      {/* ── Weekly members content visual grid ─────────── */}
      {activeWeeklyContent.length > 0 && (
        <SectionReveal className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-600 dark:text-fuchsia-400">members · this week</p>
            <div className="h-px flex-1 bg-gradient-to-r from-fuchsia-200/60 to-transparent dark:from-fuchsia-800/30" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {activeWeeklyContent.map((item, i) => (
              <motion.div
                key={item.id ?? item.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={`/fanclub/${item.slug}`}
                  onClick={() => trackCtaClick('fc_home_weekly_grid', 'content_click', { slug: item.slug })}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-fuchsia-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-300/70 hover:shadow-md dark:border-fuchsia-900/40 dark:bg-gray-900/70 dark:hover:border-fuchsia-800/50 min-h-[9rem]"
                >
                  {/* Subtle gradient bg on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-50/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-fuchsia-950/20" />
                  <div className="relative">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-fuchsia-500 dark:text-fuchsia-400">
                      {item.category ?? 'weekly'}
                    </p>
                    <h3 className="mt-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300 line-clamp-2">
                      {item.heroTitle ?? item.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                      {item.shortHighlight ?? item.heroCopy ?? '会員向けコンテンツを公開中。'}
                    </p>
                  </div>
                  <p className="relative mt-4 font-mono text-[10px] text-gray-400 transition-colors group-hover:text-fuchsia-600 dark:text-gray-600 dark:group-hover:text-fuchsia-400">
                    詳細を見る →
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </SectionReveal>
      )}

      <NotificationInterestButton
        location="fc_home"
        topic="weekly_update"
        site="fanclub"
        targetType="digest"
        targetId="fc-weekly-digest"
        title="今週の更新・限定・先行"
        description="会員限定の更新まとめを受け取る"
        defaultLabel="今週の更新通知を受け取る"
      />
      {memberCampaign && <CampaignHero campaign={memberCampaign} location="fc_home_campaign_hero" />}
      {sectionResolver('fc-home-bento', true) && <CuratedBentoSection
        eyebrow="member journey"
        title="会員体験を高める curated section"
        subtitle="回遊・没入感・再訪理由を作るための重要導線を bento 構成で配置。"
        items={homeBentoItems}
      />}
      {sectionResolver('fc-home-spotlight', true) && <EditorialSpotlightSection
        title="Members Spotlight"
        subtitle="限定体験・先行導線・次に見るべき更新を編集表示"
        items={fanclubSpotlights}
      />}

      {sectionResolver('fc-home-store-bridge', true) && storeBenefits.length > 0 && (
        <SectionReveal className="mt-10 rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/40 p-6 shadow-sm dark:border-violet-900/60 dark:bg-violet-950/20 dark:from-transparent dark:via-transparent dark:to-transparent">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-eyebrow mb-1">Member Store</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">会員向け販売・先行案内</h2>
            </div>
            <Link
              to={storeLink('/products')}
              onClick={() => trackCtaClick('fc_home_store_bridge', 'to_store_products')}
              className="group inline-flex items-center gap-1 text-xs text-violet-600 transition-colors hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
            >
              ストア一覧へ <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {storeBenefits.map((item) => (
              <Link
                key={item.id}
                to={storeLink(`/products/${item.slug}`)}
                onClick={() => trackCtaClick('fc_home_store_bridge', 'store_product_click', { slug: item.slug })}
                className="group rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/80 hover:shadow-md dark:border-violet-900/60 dark:bg-gray-900/70 dark:hover:border-violet-800/60"
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400">{item.earlyAccess ? 'EARLY ACCESS' : 'MEMBER BENEFIT'}</p>
                <p className="mt-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{item.specialOffer ?? item.memberBenefit ?? '会員向け販売情報あり'}</p>
              </Link>
            ))}
          </div>
        </SectionReveal>
      )}

      {/* ── playful: hidden quote + easter egg ─────────── */}
      <HiddenQuote
        quote={t('playful.fcHomeHiddenQuote', { defaultValue: 'ファンクラブは、静かに特別な場所だ。' })}
        author="mizzz"
        location="fc_home_bottom"
        className="mt-6"
      />
      <p className="mt-2 text-center">
        <EasterEggTrigger
          id="fc-home-official-label"
          triggerCount={5}
          message={t('playful.fcEasterEggMessage', { defaultValue: 'ありがとう、見つけてくれて。' })}
          location="fc_home"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-300 dark:text-gray-700 cursor-default select-none">
            official fanclub
          </span>
        </EasterEggTrigger>
      </p>
    </section>
  )
}

export function FanclubAboutSitePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <PageHead title="ファンクラブについて | mizzz official fanclub" description="ファンクラブのコンセプト・特典・更新頻度。" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">ファンクラブについて</h1>
      <p className="mt-5 text-sm leading-7 text-gray-600 dark:text-gray-300">静けさと余白を大切に、作品の背景と日々の更新を丁寧に届ける会員サイトです。ニュース、ブログ、動画、ギャラリー、イベント・チケット先行情報を継続的に配信します。</p>
      <ul className="mt-8 space-y-3 text-sm text-gray-700 dark:text-gray-200">
        <li>・更新頻度目安: 週2〜4回（ニュース / ブログ / 映像 / 写真）</li>
        <li>・会員特典: 限定コンテンツ閲覧、先行案内、限定販売導線</li>
        <li>・注意事項: 公開範囲や公開期限はコンテンツごとに異なります</li>
      </ul>
      <Link to={ROUTES.FC_JOIN} onClick={() => trackCtaClick('fc_about', 'join')} className="mt-8 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">入会ページへ →</Link>
    </section>
  )
}

export function FanclubJoinPage() {
  const { user } = useCurrentUser()
  const { getAccessToken } = useAuthClient()
  const { items: plans } = useStrapiCollection<MembershipPlan>(() => getMembershipPlans())
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  async function handleJoin(planId: string): Promise<void> {
    if (!user) return
    try {
      setLoadingPlanId(planId)
      setCheckoutError(null)
      const authToken = await getAccessToken()
      if (!authToken) {
        setCheckoutError('ログインセッションの確認に失敗しました。再ログイン後にお試しください。')
        return
      }
      const session = await createFanclubCheckoutSession({
        planId,
        locale: String((navigator.language || 'ja').split('-')[0] || 'ja'),
        authToken,
      })
      window.location.assign(session.url)
    } catch {
      setCheckoutError('決済ページの準備に失敗しました。時間を置いて再度お試しください。')
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <PageHead title="入会 | mizzz official fanclub" description="会費、支払い頻度、登録フロー、注意事項。" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">入会プラン</h1>
      <div className="mt-6 rounded-3xl border border-fuchsia-200/70 bg-gradient-to-br from-white via-fuchsia-50/70 to-white p-5 dark:border-fuchsia-900/50 dark:from-gray-900 dark:via-fuchsia-950/20 dark:to-gray-900">
        <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fuchsia-600 dark:text-fuchsia-300">membership concept</p>
            <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">会員限定コンテンツ、先行案内、会員向けストア導線を「今週の更新」起点で迷わず回遊できるよう設計しています。</p>
          </div>
          <BrandIllustration variant="fanclub" className="aspect-[6/4]" />
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {((plans && plans.length > 0) ? plans : [
          { id: 0, documentId: 'default-paid', name: '有料会員（standard）', description: '月額 880円 / 年額 8,800円。限定ニュース、ブログ、動画、ギャラリー、チケット先行案内。', price: 880, currency: 'JPY', billingCycle: 'monthly', isJoinable: true, membershipType: 'paid' },
          { id: 1, documentId: 'default-premium', name: 'プレミアム会員（将来拡張）', description: '上位プランを追加できるよう、権限制御を拡張可能な構造で設計。', price: 0, currency: 'JPY', billingCycle: 'monthly', isJoinable: false, membershipType: 'premium' },
        ]).map((plan) => (
          <article key={plan.documentId} className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{plan.description ?? '詳細は順次公開します。'}</p>
            {plan.price > 0 && (
              <p className="mt-3 font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                ¥{plan.price.toLocaleString()} <span className="text-xs font-normal text-gray-400">/ {plan.billingCycle === 'yearly' ? '年額' : '月額'}</span>
              </p>
            )}
            {plan.price === 0 && (
              <p className="mt-3 font-mono text-sm text-gray-400 dark:text-gray-500">価格未定</p>
            )}
            {plan.isJoinable && user && (
              <button
                type="button"
                onClick={() => void handleJoin(plan.documentId)}
                disabled={loadingPlanId === plan.documentId}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {loadingPlanId === plan.documentId ? '決済ページを準備中...' : 'Stripe Checkoutで加入する'}
              </button>
            )}
          </article>
        ))}
      </div>
      <ol className="mt-8 list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-200">
        <li>メール認証でアカウント作成</li>
        <li>プラン選択・決済手段登録</li>
        <li>利用規約 / プライバシー / 特商法 / 継続課金ポリシーに同意</li>
      </ol>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={ROUTES.FC_LOGIN} onClick={() => trackCtaClick('fc_join', 'start_signup')} className="rounded-full bg-gray-900 px-5 py-2.5 text-sm text-white dark:bg-gray-100 dark:text-gray-900">会員登録を開始</Link>
        <Link to={ROUTES.FC_SUBSCRIPTION_POLICY} className="text-sm text-gray-500 underline">継続課金 / 解約ポリシー</Link>
      </div>
      {checkoutError && <p className="mt-4 text-xs text-rose-600 dark:text-rose-300">{checkoutError}</p>}
    </section>
  )
}

export function FanclubLoginPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const redirectPath = normalizeRedirectPath(searchParams.get('redirect'))

  return (
    <section className="mx-auto max-w-xl px-4 py-14">
      <PageHead title="ログイン | mizzz official fanclub" description="ログイン、メール認証、パスワード再設定。" noindex />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">ログイン</h1>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">ログイン後はマイページから契約状況、更新日、最近の更新、退会 / 解約導線を確認できます。</p>
      <div className="mt-8 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <p className="text-sm text-gray-700 dark:text-gray-200">認証基盤は Logto を使用します。メール認証・セッション管理・SSO に対応。</p>
        <p className="mt-2 text-xs text-gray-500">※ Logto 未設定環境ではログインUIは無効化されます。</p>
      </div>
      <div className="mt-5 rounded-2xl border border-violet-200/80 bg-violet-50/60 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">secure + smooth</p>
        <p className="mt-2 text-xs leading-6 text-gray-600 dark:text-gray-300">ログイン後は会員向け更新・先行特典・継続課金ポリシーへ即アクセスできる導線を維持します。</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link to={ROUTES.FC_LOGIN_RESET_PASSWORD} className="text-gray-600 underline hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">パスワード再設定</Link>
        <Link to={ROUTES.FC_LOGIN_VERIFY_EMAIL} className="text-gray-600 underline hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">メール認証を再確認</Link>
      </div>
      <FanclubLoginActions redirectPath={redirectPath} />
      <Link to={ROUTES.FC_MYPAGE} className="mt-8 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">{t('nav.member', { defaultValue: 'マイページ' })}へ →</Link>
    </section>
  )
}

function normalizeRedirectPath(raw: string | null): string {
  if (!raw) return ROUTES.FC_MYPAGE
  if (!raw.startsWith('/')) return ROUTES.FC_MYPAGE
  if (raw.startsWith('//')) return ROUTES.FC_MYPAGE
  return raw
}

function FanclubLoginActionsWithAuth({ redirectPath }: { redirectPath: string }) {
  const { signIn, signUp } = useAuthClient()
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => {
          trackCtaClick('fc_login', 'open_signin', { redirectPath })
          void signIn(redirectPath)
        }}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
      >
        ログインを開く
      </button>
      <button
        type="button"
        onClick={() => {
          trackCtaClick('fc_login', 'open_signup', { redirectPath })
          void signUp(redirectPath)
        }}
        className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-500 dark:border-gray-700 dark:text-gray-200"
      >
        新規登録
      </button>
    </div>
  )
}

function FanclubLoginActionsNoAuth() {
  return (
    <p className="mt-6 text-xs text-gray-500">
      Logto 未設定のため、この環境ではログインフローを実行できません。
    </p>
  )
}

const FanclubLoginActions = HAS_AUTH
  ? FanclubLoginActionsWithAuth
  : FanclubLoginActionsNoAuth

export function FanclubResetPasswordPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14">
      <PageHead title="パスワード再設定 | mizzz official fanclub" description="パスワード再設定の案内。" noindex />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">パスワード再設定</h1>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">メールアドレス宛に再設定リンクを送信します。リンクは一定時間で失効します。</p>
      <Link to={ROUTES.FC_LOGIN} className="mt-7 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">ログインへ戻る →</Link>
    </section>
  )
}

export function FanclubVerifyEmailPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14">
      <PageHead title="メール認証 | mizzz official fanclub" description="メール認証の案内。" noindex />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">メール認証</h1>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">登録メールへ送信された確認リンクを開いて認証を完了してください。認証後に会員限定ページへアクセスできます。</p>
      <Link to={ROUTES.FC_MYPAGE} className="mt-7 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">マイページを開く →</Link>
    </section>
  )
}

export function FanclubMyPageSite() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const { getAccessToken } = useAuthClient()
  const { products } = useProductList(8)
  const { items: campaigns } = useStrapiCollection<CampaignSummary>(() => getCampaignList())
  const memberStoreItems = useMemo(() => products.filter((item) => item.earlyAccess || item.accessStatus === 'fc_only' || item.memberBenefit).slice(0, 4), [products])
  const mypageCampaign = useMemo(
    () =>
      (campaigns ?? [])
        .filter((item) => item.membersOnly || item.earlyAccess || item.pickup)
        .filter((item) => isCampaignActive(item))
        .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))[0] ?? null,
    [campaigns],
  )
  const mypageDigestItems = useMemo<UpdateDigestItem[]>(() => ([
    {
      id: 'mypage-weekly-news',
      title: '今週の更新をまとめて確認',
      description: 'News / Blog / Movie / Gallery の更新を毎週チェック。',
      href: ROUTES.NEWS,
      tone: 'new',
      location: 'fc_mypage_digest',
    },
    {
      id: 'mypage-event-priority',
      title: '注目イベント・先行受付',
      description: '次回イベントとチケット先行の受付情報を優先表示。',
      href: ROUTES.FC_TICKETS,
      tone: 'important',
      location: 'fc_mypage_digest',
    },
    {
      id: 'mypage-member-store',
      title: '会員向けストア特典',
      description: '限定・先行・会員特典つき商品を横断して確認。',
      href: storeLink('/products'),
      tone: 'members',
      location: 'fc_mypage_digest',
    },
  ]), [])
  const weeklyUpdates = useMemo(
    () => [
      { id: 'weekly-movie', label: 'NEW', title: '限定ムービーを追加', href: ROUTES.FC_MOVIES },
      { id: 'weekly-gallery', label: 'UPDATE', title: 'ギャラリーを更新', href: ROUTES.FC_GALLERY },
      { id: 'weekly-ticket', label: 'EARLY', title: '先行チケット情報を公開', href: ROUTES.FC_TICKETS },
    ],
    [],
  )

  useEffect(() => {
    trackCtaClick('fc_mypage', 'dashboard_view', {
      contractStatus: user?.contractStatus ?? 'active',
      memberPlan: user?.memberPlan ?? 'paid',
    })
  }, [user?.contractStatus, user?.memberPlan])

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  async function handleOpenPortal(): Promise<void> {
    try {
      const authToken = await getAccessToken()
      if (!authToken) {
        setPortalError('ログインセッションの確認に失敗しました。再ログイン後にお試しください。')
        return
      }
      setPortalLoading(true)
      setPortalError(null)
      const session = await createCustomerPortalSession({ authToken })
      window.location.assign(session.url)
    } catch {
      setPortalError('Customer Portal の起動に失敗しました。')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHead title="マイページ | mizzz official fanclub" description="会員ステータス、契約プラン、次回更新日、退会導線。" noindex />
      <p className="font-mono text-xs tracking-[0.14em] text-gray-500">MY PAGE</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">会員ダッシュボード</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-fuchsia-200/70 bg-fuchsia-50/70 p-4 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fuchsia-700 dark:text-fuchsia-200">weekly update</p>
          <p className="mt-1 text-xs text-gray-700 dark:text-gray-200">今週追加された会員限定コンテンツを要点で表示。</p>
        </div>
        <div className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-violet-700 dark:text-violet-200">member benefit</p>
          <p className="mt-1 text-xs text-gray-700 dark:text-gray-200">会員向けストア特典・先行販売を横断表示。</p>
        </div>
        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-4 dark:border-sky-900/60 dark:bg-sky-950/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sky-700 dark:text-sky-200">quick access</p>
          <p className="mt-1 text-xs text-gray-700 dark:text-gray-200">Movies / Gallery / Tickets へのショートカット。</p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">policy</p>
          <p className="mt-1 text-xs text-gray-700 dark:text-gray-200">継続課金・解約関連の確認導線を常設。</p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70 lg:col-span-2">
          <p className="text-xs text-gray-500">会員ステータス</p>
          <p className="mt-2 text-base font-medium text-gray-900 dark:text-gray-100">{user?.contractStatus ?? 'active'}</p>
          <p className="mt-1 text-xs text-gray-500">契約プラン: {user?.memberPlan ?? 'paid'}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="text-[11px] text-gray-500">最近の更新</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">限定ブログを1件追加</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="text-[11px] text-gray-500">ショートカット</p>
              <Link to={ROUTES.FC_MOVIES} onClick={() => trackCtaClick('fc_mypage', 'shortcut_movies')} className="mt-1 inline-flex text-sm text-violet-600 hover:text-violet-500">Moviesへ →</Link>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
          <p className="text-xs text-gray-500">次回更新日</p>
          <p className="mt-2 text-sm text-gray-800 dark:text-gray-100">2026-05-01（仮）</p>
          <p className="mt-2 text-xs text-gray-500">解約 / 退会はポリシーに沿って手続きできます。</p>
          <Link to={ROUTES.FC_SUBSCRIPTION_POLICY} onClick={() => trackCtaClick('fc_mypage', 'subscription_policy')} className="mt-3 inline-flex text-xs text-violet-600 hover:text-violet-500">継続課金ポリシーを確認</Link>
          <button
            type="button"
            onClick={() => void handleOpenPortal()}
            disabled={portalLoading}
            className="mt-2 block text-xs text-gray-500 underline disabled:opacity-60"
          >
            {portalLoading ? 'Customer Portal を起動中...' : '支払い方法・請求情報を管理'}
          </button>
          <Link to={ROUTES.STORE_HOME} onClick={() => trackCtaClick('fc_mypage', 'to_store')} className="mt-2 block text-xs text-gray-500 underline">ストア連携導線へ</Link>
          {portalError && <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-300">{portalError}</p>}
        </article>
      </div>

      <UpdateDigestSection
        title="次に見るべき更新"
        subtitle="未読になりやすい更新導線を上部に集約"
        items={mypageDigestItems}
      />

      {/* ── playful: 会員限定ウェルカム + 日替わりメッセージ ── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MemberPlayfulBlock site="fanclub" className="sm:col-span-1" />
        <DailyMessageCard
          memberOnly
          location="fc_mypage_daily"
          className="sm:col-span-1"
        />
        <SurpriseCard
          teaser={t('playful.fcMypageSurpriseTeaser', { defaultValue: '今週のひみつを見る' })}
          title={t('playful.fcMypageSurpriseTitle', { defaultValue: '会員へのひとこと' })}
          body={t('playful.fcMypageSurpriseBody', { defaultValue: '毎週コンテンツを選んでいます。あなたが見てくれていることが、次の制作の力になっています。' })}
          periodLabel="weekly"
          location="fc_mypage_surprise"
          className="sm:col-span-1"
        />
      </div>

      {mypageCampaign && <CampaignHero campaign={mypageCampaign} location="fc_mypage_campaign_hero" />}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">最近の更新</h2>
          <ul className="mt-3 space-y-2">
            {weeklyUpdates.map((item) => (
              <li key={item.id}>
                <Link to={item.href} onClick={() => trackCtaClick('fc_mypage_weekly', 'weekly_update_click', { id: item.id })} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200 dark:hover:bg-gray-900">
                  <span className="line-clamp-1">{item.title}</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">おすすめ導線</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link to={ROUTES.FC_GALLERY} onClick={() => trackCtaClick('fc_mypage', 'recommend_gallery')} className="rounded-full border border-gray-300 px-3 py-1.5 dark:border-gray-700">Gallery</Link>
            <Link to={ROUTES.EVENTS} onClick={() => trackCtaClick('fc_mypage', 'recommend_events')} className="rounded-full border border-gray-300 px-3 py-1.5 dark:border-gray-700">Events</Link>
            <Link to={ROUTES.FC_TICKETS} onClick={() => trackCtaClick('fc_mypage', 'recommend_tickets')} className="rounded-full border border-gray-300 px-3 py-1.5 dark:border-gray-700">Tickets</Link>
          </div>
        </article>
        <NotificationSettingsPanel location="fc_mypage" />
      </div>

      {memberStoreItems.length > 0 && (
        <article className="mt-8 rounded-2xl border border-violet-200 bg-violet-50/60 p-5 dark:border-violet-900/60 dark:bg-violet-950/20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">会員向けストア導線</h2>
            <Link to={storeLink('/products')} onClick={() => trackCtaClick('fc_mypage_member_store', 'to_store')} className="text-xs text-violet-700 underline dark:text-violet-300">ストアへ</Link>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {memberStoreItems.map((item) => (
              <Link key={item.id} to={storeLink(`/products/${item.slug}`)} onClick={() => trackCtaClick('fc_mypage_member_store', 'store_item_click', { slug: item.slug })} className="rounded-xl border border-violet-200 bg-white/90 px-3 py-2 text-sm text-gray-700 dark:border-violet-900/70 dark:bg-gray-900/70 dark:text-gray-200">
                <span className="font-medium">{item.title}</span>
                <span className="ml-1 text-xs text-violet-600 dark:text-violet-300">{item.earlyAccess ? '先行' : '特典'}</span>
              </Link>
            ))}
          </div>
          <NotificationInterestButton
            location="fc_mypage_member_store"
            topic="member_early_access"
            site="cross"
            targetType="digest"
            targetId="member-store-bridge"
            title="会員向けストア導線"
            description="会員向け先行販売や限定特典の案内を受け取る"
            defaultLabel="会員向けストア通知を受け取る"
          />
        </article>
      )}

      {/* ── playful: hidden quote ─────────────────────── */}
      <HiddenQuote
        quote={t('playful.fcHiddenQuote', { defaultValue: '会員であることは、静かな特別さだ。' })}
        author="mizzz fanclub"
        location="fc_mypage_bottom"
        className="mt-6"
      />
    </section>
  )
}

export function FanclubMoviesPage() {
  return <FcSectionTemplate title="MOVIES" description="会員限定動画・コメント動画・backstage を配信します。" items={MOVIES} detailBase={ROUTES.FC_MOVIES} />
}

export function FanclubMoviesDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const item = MOVIES.find((entry) => entry.slug === slug)
  if (!item) return <SimpleNotFound title="動画が見つかりません" />
  return <FcDetailTemplate item={item} title="MOVIES" />
}

export function FanclubGalleryPage() {
  return <FcSectionTemplate title="GALLERY" description="オフショット、イベント写真、アートワークを掲載します。" items={GALLERIES} detailBase={ROUTES.FC_GALLERY} />
}

export function FanclubGalleryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const item = GALLERIES.find((entry) => entry.slug === slug)
  if (!item) return <SimpleNotFound title="ギャラリーが見つかりません" />
  return <FcDetailTemplate item={item} title="GALLERY" />
}

export function FanclubTicketsPage() {
  return <FcSectionTemplate title="TICKETS" description="チケット先行受付の対象・期間・申込方法を案内します。" items={TICKETS} detailBase={ROUTES.FC_TICKETS} />
}

export function FanclubTicketsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const item = TICKETS.find((entry) => entry.slug === slug)
  if (!item) return <SimpleNotFound title="先行情報が見つかりません" />
  return <FcDetailTemplate item={item} title="TICKETS" />
}

function FcDetailTemplate({ item, title }: { item: FcItem; title: string }) {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const role = user?.role ?? 'guest'
  const locked = !canAccessByRole(role, item.visibility)
  const accessLabel: Record<Visibility, string> = {
    public: t('fanclub.accessPublic'),
    members: t('fanclub.accessMembers'),
    premium: t('fanclub.accessPremium'),
  }
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <PageHead title={`${item.title} | ${title}`} description={item.description} noindex />
      <p className="font-mono text-xs text-gray-500">{title}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{item.title}</h1>
      <p className="mt-2 text-xs text-gray-500">{item.publishAt}</p>
      {locked ? (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-700 dark:text-gray-200">{accessLabel[item.visibility]} — {t('fanclub.joinToView')}</p>
          <Link to={ROUTES.FC_JOIN} onClick={() => trackCtaClick('fc_detail_locked', 'join', { title: item.title })} className="mt-4 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">{t('fanclub.joinToView')} →</Link>
        </div>
      ) : (
        <p className="mt-8 text-sm leading-7 text-gray-700 dark:text-gray-200">{item.description}</p>
      )}
    </section>
  )
}

function SimpleNotFound({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      <Link to={ROUTES.HOME} className="mt-4 inline-flex text-sm text-violet-600">トップへ戻る</Link>
    </section>
  )
}

export function FanclubMemberStorePage() {
  return <SimpleStaticPage title="MEMBER STORE" description="会員限定販売 / 先行販売 / デジタル特典の案内ページ。将来的に store.mizzz.jp と会員状態連携します。" />
}

export function FanclubSchedulePage() {
  return <SimpleStaticPage title="SCHEDULE" description="ライブ、出演、配信、リリース情報を一覧表示します。" />
}

export function FanclubGuidePage() {
  const links = [
    { to: ROUTES.SUPPORT_CENTER, label: 'サポートセンター' },
    { to: ROUTES.FAQ, label: 'FAQ' },
    { to: ROUTES.FC_SUBSCRIPTION_POLICY, label: '継続課金 / 解約ポリシー' },
    { to: ROUTES.CONTACT, label: 'お問い合わせ' },
  ]

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <PageHead title="GUIDE | mizzz official fanclub" description="入会から解約までのガイド、閲覧環境、よくあるトラブルをまとめます。" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">GUIDE</h1>
      <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">入会から解約までのガイド、閲覧環境、よくあるトラブルをまとめます。</p>
      <ul className="mt-6 space-y-2">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-sm text-violet-600 underline-offset-2 hover:underline dark:text-violet-300">{item.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FanclubLegalIndexPage() {
  const links = useMemo(
    () => [
      { to: ROUTES.FC_TERMS, label: '利用規約' },
      { to: ROUTES.FC_PRIVACY, label: 'プライバシーポリシー' },
      { to: ROUTES.FC_COMMERCE_LAW, label: '特商法表記' },
      { to: ROUTES.FC_SUBSCRIPTION_POLICY, label: '継続課金 / 解約ポリシー' },
      { to: ROUTES.CONTACT, label: 'お問い合わせ' },
    ],
    [],
  )

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <PageHead title="法務ガイド | mizzz official fanclub" description="利用規約、プライバシー、特商法、課金ポリシー。" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">法務ガイド</h1>
      <ul className="mt-8 space-y-3">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-sm text-gray-700 underline hover:text-gray-900 dark:text-gray-200">{item.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FanclubSubscriptionPolicyPage() {
  return <SimpleStaticPage title="SUBSCRIPTION POLICY" description="更新タイミング、決済失敗時の扱い、解約予約、返金ポリシーを明記するページです。" noindex />
}

function SimpleStaticPage({ title, description, noindex = false }: { title: string; description: string; noindex?: boolean }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <PageHead title={`${title} | mizzz official fanclub`} description={description} noindex={noindex} />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
    </section>
  )
}
