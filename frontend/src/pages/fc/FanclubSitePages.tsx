import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'
import { useCurrentUser, useStrapiCollection } from '@/hooks'
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

const ACCESS_LABEL: Record<Visibility, string> = {
  public: '一般公開',
  members: '会員限定',
  premium: 'プレミアム限定',
}

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
  const { user } = useCurrentUser()
  const role = user?.role ?? 'guest'
  useEffect(() => {
    trackCtaClick('fc_section', 'view', { section: title, loggedIn: role !== 'guest' })
  }, [role, title])

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <PageHead title={`${title} | mizzz official fanclub`} description={description} noindex />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">fanclub archive</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const isLocked = !canAccessByRole(role, item.visibility)
          return (
            <article key={item.slug} className="rounded-2xl border border-gray-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{item.publishAt}</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${isLocked ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'}`}>
                  {isLocked ? `🔒 ${ACCESS_LABEL[item.visibility]}` : ACCESS_LABEL[item.visibility]}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
              <div className="mt-5">
                {isLocked ? (
                  <Link to={ROUTES.FC_JOIN} onClick={() => trackCtaClick('fc_section', 'join_from_locked', { title: item.title, section: title })} className="text-sm font-medium text-violet-600 hover:text-violet-500">入会して閲覧する →</Link>
                ) : (
                  <Link to={`${detailBase}/${item.slug}`} onClick={() => trackCtaClick('fc_section', 'content_detail', { slug: item.slug, section: title })} className="text-sm font-medium text-gray-900 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300">詳細を見る →</Link>
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
  const { products } = useProductList(8)
  const { items: campaigns } = useStrapiCollection<CampaignSummary>(() => getCampaignList())
  const storeBenefits = useMemo(() => products.filter((item) => item.earlyAccess || item.memberBenefit || item.accessStatus === 'fc_only').slice(0, 3), [products])
  const memberCampaign = useMemo(
    () =>
      (campaigns ?? [])
        .filter((item) => item.membersOnly || item.earlyAccess)
        .filter((item) => isCampaignActive(item))
        .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))[0] ?? null,
    [campaigns],
  )
  const homeDigestItems = useMemo<UpdateDigestItem[]>(() => ([
    {
      id: 'members-weekly',
      title: '会員限定の今週更新',
      description: 'Movies / Gallery / Tickets の更新をまとめて確認できます。',
      href: ROUTES.FC_MYPAGE,
      tone: 'members',
      location: 'fc_home_digest',
    },
    {
      id: 'early-store',
      title: 'FC向け先行販売情報',
      description: '会員向け販売・先行案内をストア連携で確認。',
      href: storeLink('/products'),
      tone: 'early',
      location: 'fc_home_digest',
    },
    {
      id: 'join-value',
      title: '継続特典と次回更新を確認',
      description: 'マイページで次に見るべき内容を迷わずチェック。',
      href: ROUTES.FC_MYPAGE,
      tone: 'important',
      location: 'fc_home_digest',
    },
  ]), [])
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageHead
        title="mizzz official fanclub"
        description="mizzz の公式ファンクラブ。ニュース、ブログ、動画、ギャラリー、チケット先行情報を会員向けに配信。"
      />
      <header className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900/70 dark:shadow-black/20 md:p-10">
        <p className="font-mono text-xs tracking-[0.18em] text-gray-500">OFFICIAL FANCLUB</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-6xl">mizzz official fanclub</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">限定ニュース、ブログ、動画、ギャラリー、イベント先行情報を、余白と静けさを保ちながら届けるメンバーシップサイトです。</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
            <p className="font-mono text-xs text-gray-500">料金</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">月額 880円 / 年額 8,800円</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
            <p className="font-mono text-xs text-gray-500">今週の更新</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">動画・ブログ・イベント情報を順次公開</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
            <p className="font-mono text-xs text-gray-500">限定特典</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">先行案内 / FC限定公開 / 会員向け販売導線</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
            <p className="font-mono text-xs text-gray-500">FAQ</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">入会・解約・公開範囲の案内を常設</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to={ROUTES.FC_JOIN} onClick={() => trackCtaClick('fc_home', 'join')} className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900">入会する</Link>
          <Link to={ROUTES.FC_LOGIN} onClick={() => trackCtaClick('fc_home', 'login')} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 hover:border-gray-500 dark:border-gray-700 dark:text-gray-100">ログイン</Link>
          <Link to={storeLink(ROUTES.STORE_HOME)} onClick={() => trackCtaClick('fc_home', 'to_store')} className="rounded-full border border-violet-300 bg-violet-50 px-5 py-2.5 text-sm font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">会員向けストアを見る</Link>
          <Link to={ROUTES.FAQ} onClick={() => trackCtaClick('fc_home', 'faq')} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">FAQ</Link>
        </div>
      </header>

      <UpdateDigestSection
        title="今週の更新・限定・先行"
        subtitle="再訪時に価値が分かる導線を先頭で確認"
        items={homeDigestItems}
      />
      {memberCampaign && <CampaignHero campaign={memberCampaign} location="fc_home_campaign_hero" />}
      <EditorialSpotlightSection
        title="Members Spotlight"
        subtitle="限定体験・先行導線・次に見るべき更新を編集表示"
        items={fanclubSpotlights}
      />

      {storeBenefits.length > 0 && (
        <section className="mt-8 rounded-3xl border border-violet-200 bg-violet-50/70 p-6 dark:border-violet-900/60 dark:bg-violet-950/20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">会員向け販売・先行案内</h2>
            <Link to={storeLink('/products')} onClick={() => trackCtaClick('fc_home_store_bridge', 'to_store_products')} className="text-xs text-violet-700 underline dark:text-violet-300">ストア一覧へ</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {storeBenefits.map((item) => (
              <Link key={item.id} to={storeLink(`/products/${item.slug}`)} onClick={() => trackCtaClick('fc_home_store_bridge', 'store_product_click', { slug: item.slug })} className="rounded-2xl border border-violet-200 bg-white p-4 dark:border-violet-900/70 dark:bg-gray-900/70">
                <p className="font-mono text-[10px] uppercase tracking-wider text-violet-600">{item.earlyAccess ? 'EARLY ACCESS' : 'MEMBER BENEFIT'}</p>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{item.specialOffer ?? item.memberBenefit ?? '会員向け販売情報あり'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
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
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <PageHead title="入会 | mizzz official fanclub" description="会費、支払い頻度、登録フロー、注意事項。" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">入会プラン</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <h2 className="text-lg font-semibold">有料会員（standard）</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">月額 880円 / 年額 8,800円。限定ニュース、ブログ、動画、ギャラリー、チケット先行案内。</p>
        </article>
        <article className="rounded-2xl border border-dashed border-gray-300 p-5 dark:border-gray-700">
          <h2 className="text-lg font-semibold">プレミアム会員（将来拡張）</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">上位プランを追加できるよう、権限制御を拡張可能な構造で設計。</p>
        </article>
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
        <p className="text-sm text-gray-700 dark:text-gray-200">認証基盤は Clerk を使用します。メール認証・パスワード再設定・セッション管理に対応。</p>
        <p className="mt-2 text-xs text-gray-500">※ Clerk 未設定環境ではログインUIは無効化されます。</p>
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

function FanclubLoginActionsWithClerk({ redirectPath }: { redirectPath: string }) {
  const { openSignIn, openSignUp } = useClerk()
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => {
          trackCtaClick('fc_login', 'open_signin', { redirectPath })
          void openSignIn({ afterSignInUrl: redirectPath })
        }}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
      >
        ログインを開く
      </button>
      <button
        type="button"
        onClick={() => {
          trackCtaClick('fc_login', 'open_signup', { redirectPath })
          void openSignUp({ afterSignUpUrl: redirectPath })
        }}
        className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-500 dark:border-gray-700 dark:text-gray-200"
      >
        新規登録
      </button>
    </div>
  )
}

function FanclubLoginActionsNoClerk() {
  return (
    <p className="mt-6 text-xs text-gray-500">
      Clerk 未設定のため、この環境ではログインフローを実行できません。
    </p>
  )
}

const FanclubLoginActions = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  ? FanclubLoginActionsWithClerk
  : FanclubLoginActionsNoClerk

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
  const { user } = useCurrentUser()
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHead title="マイページ | mizzz official fanclub" description="会員ステータス、契約プラン、次回更新日、退会導線。" noindex />
      <p className="font-mono text-xs tracking-[0.14em] text-gray-500">MY PAGE</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">会員ダッシュボード</h1>

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
          <Link to={ROUTES.STORE_HOME} onClick={() => trackCtaClick('fc_mypage', 'to_store')} className="mt-2 block text-xs text-gray-500 underline">ストア連携導線へ</Link>
        </article>
      </div>

      <UpdateDigestSection
        title="次に見るべき更新"
        subtitle="未読になりやすい更新導線を上部に集約"
        items={mypageDigestItems}
      />
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
        </article>
      )}
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
  const { user } = useCurrentUser()
  const role = user?.role ?? 'guest'
  const locked = !canAccessByRole(role, item.visibility)
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <PageHead title={`${item.title} | ${title}`} description={item.description} noindex />
      <p className="font-mono text-xs text-gray-500">{title}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{item.title}</h1>
      <p className="mt-2 text-xs text-gray-500">{item.publishAt}</p>
      {locked ? (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-700 dark:text-gray-200">このコンテンツは {ACCESS_LABEL[item.visibility]} です。入会後に閲覧できます。</p>
          <Link to={ROUTES.FC_JOIN} onClick={() => trackCtaClick('fc_detail_locked', 'join', { title: item.title })} className="mt-4 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">入会する →</Link>
        </div>
      ) : (
        <p className="mt-8 text-sm leading-7 text-gray-700 dark:text-gray-200">{item.description}（実運用では CMS 登録本文・動画URL・公開期限・関連コンテンツを表示）</p>
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
  return <SimpleStaticPage title="GUIDE" description="入会から解約までのガイド、閲覧環境、よくあるトラブルをまとめます。" />
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
