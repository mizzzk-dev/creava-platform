import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'
import { useCurrentUser } from '@/hooks'
import { canAccessByRole, type VisibilityScope } from '@/lib/auth/membership'

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
                  <Link to={ROUTES.FC_JOIN} className="text-sm font-medium text-violet-600 hover:text-violet-500">入会して閲覧する →</Link>
                ) : (
                  <Link to={`${detailBase}/${item.slug}`} className="text-sm font-medium text-gray-900 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300">詳細を見る →</Link>
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
          <Link to={ROUTES.FC_JOIN} className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900">入会する</Link>
          <Link to={ROUTES.FC_LOGIN} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 hover:border-gray-500 dark:border-gray-700 dark:text-gray-100">ログイン</Link>
          <Link to={ROUTES.FAQ} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">FAQ</Link>
        </div>
      </header>
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
      <Link to={ROUTES.FC_JOIN} className="mt-8 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">入会ページへ →</Link>
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
        <Link to={ROUTES.FC_LOGIN} className="rounded-full bg-gray-900 px-5 py-2.5 text-sm text-white dark:bg-gray-100 dark:text-gray-900">会員登録を開始</Link>
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
        onClick={() => void openSignIn({ afterSignInUrl: redirectPath })}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
      >
        ログインを開く
      </button>
      <button
        type="button"
        onClick={() => void openSignUp({ afterSignUpUrl: redirectPath })}
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
              <Link to={ROUTES.FC_MOVIES} className="mt-1 inline-flex text-sm text-violet-600 hover:text-violet-500">Moviesへ →</Link>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
          <p className="text-xs text-gray-500">次回更新日</p>
          <p className="mt-2 text-sm text-gray-800 dark:text-gray-100">2026-05-01（仮）</p>
          <p className="mt-2 text-xs text-gray-500">解約 / 退会はポリシーに沿って手続きできます。</p>
          <Link to={ROUTES.FC_SUBSCRIPTION_POLICY} className="mt-3 inline-flex text-xs text-violet-600 hover:text-violet-500">継続課金ポリシーを確認</Link>
          <Link to={ROUTES.STORE_HOME} className="mt-2 block text-xs text-gray-500 underline">ストア連携導線へ</Link>
        </article>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">最近の更新</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li>・限定ブログを1件更新しました</li>
            <li>・次回イベント情報を公開しました</li>
            <li>・会員限定動画を追加しました</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">おすすめ導線</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link to={ROUTES.FC_GALLERY} className="rounded-full border border-gray-300 px-3 py-1.5 dark:border-gray-700">Gallery</Link>
            <Link to={ROUTES.EVENTS} className="rounded-full border border-gray-300 px-3 py-1.5 dark:border-gray-700">Events</Link>
            <Link to={ROUTES.FC_TICKETS} className="rounded-full border border-gray-300 px-3 py-1.5 dark:border-gray-700">Tickets</Link>
          </div>
        </article>
      </div>
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
          <Link to={ROUTES.FC_JOIN} className="mt-4 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">入会する →</Link>
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
