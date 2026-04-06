import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'

const MEMBER_BENEFITS = [
  'member.benefitEarly',
  'member.benefitStore',
  'member.benefitEvent',
]

const NEXT_ACTIONS = [
  { key: 'member.actionStore', to: ROUTES.STORE },
  { key: 'member.actionFanclub', to: ROUTES.FANCLUB },
  { key: 'member.actionNews', to: ROUTES.NEWS },
]

const QUICK_LINKS = [
  { key: 'member.quickContact', to: ROUTES.CONTACT },
  { key: 'member.quickFaq', to: ROUTES.FAQ },
  { key: 'member.quickEvents', to: ROUTES.EVENTS },
  { key: 'member.quickCart', to: ROUTES.CART },
]

const GUEST_TODO = [
  'member.todoGuestSignIn',
  'member.todoGuestFanclub',
  'member.todoGuestContact',
]

const MEMBER_TODO = [
  'member.todoMemberNews',
  'member.todoMemberStore',
  'member.todoMemberEvent',
]

const ADMIN_TODO = [
  'member.todoAdminPublish',
  'member.todoAdminFanclub',
  'member.todoAdminSupport',
]

const ACCESS_ITEMS = [
  {
    titleKey: 'member.accessFanclubTitle',
    descKey: 'member.accessFanclubDesc',
    signedInStatusKey: 'member.accessStatusFanclubSignedIn',
    guestStatusKey: 'member.accessStatusFanclubGuest',
    to: ROUTES.FANCLUB,
    actionKey: 'member.actionFanclub',
  },
  {
    titleKey: 'member.accessStoreTitle',
    descKey: 'member.accessStoreDesc',
    signedInStatusKey: 'member.accessStatusStoreSignedIn',
    guestStatusKey: 'member.accessStatusStoreGuest',
    to: ROUTES.STORE,
    actionKey: 'member.actionStore',
  },
  {
    titleKey: 'member.accessSupportTitle',
    descKey: 'member.accessSupportDesc',
    signedInStatusKey: 'member.accessStatusSupportSignedIn',
    guestStatusKey: 'member.accessStatusSupportGuest',
    to: ROUTES.CONTACT,
    actionKey: 'member.quickContact',
  },
]

function maskUserId(userId: string): string {
  if (userId.length <= 8) return userId
  return `${userId.slice(0, 5)}...${userId.slice(-3)}`
}

export default function MemberPage() {
  const { t } = useTranslation()
  const { user, isLoaded, isSignedIn } = useCurrentUser()
  const role = user?.role ?? 'guest'
  const isMember = role === 'member'
  const isAdmin = role === 'admin'
  const roleTodo = isAdmin ? ADMIN_TODO : isMember ? MEMBER_TODO : GUEST_TODO
  const progressTotal = roleTodo.length
  const progressDone = isAdmin ? progressTotal : isMember ? 2 : isSignedIn ? 1 : 0
  const progressPercent = Math.round((progressDone / progressTotal) * 100)

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('member.title', { defaultValue: 'マイページ' })} description={t('member.description', { defaultValue: '会員状態と特典を確認できます。' })} />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('member.title', { defaultValue: 'マイページ' })}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('member.pageLead', { defaultValue: '会員状態と利用できる導線をまとめて確認できます。' })}</p>

      {!isLoaded && <p className="mt-4 text-sm text-gray-500">{t('common.loading')}</p>}

      {isLoaded && !isSignedIn && (
        <div className="mt-6 rounded border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('member.signInPrompt', { defaultValue: '会員情報を見るにはログインしてください。' })}</p>
          <div className="mt-3 flex gap-4">
            <Link to={ROUTES.FANCLUB} className="inline-flex text-sm text-violet-500 hover:text-violet-400">{t('home.fanclub.joinButton')} →</Link>
            <Link to={ROUTES.STORE} className="inline-flex text-sm text-gray-700 dark:text-gray-300">{t('member.actionStore', { defaultValue: 'Storeを見る' })} →</Link>
          </div>
        </div>
      )}

      {isLoaded && isSignedIn && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">status</p>
              <p className="mt-2 text-xl font-medium text-gray-900 dark:text-gray-100">
                {isAdmin
                  ? t('member.adminLabel', { defaultValue: '管理者' })
                  : isMember
                    ? t('member.memberLabel', { defaultValue: 'FC会員' })
                    : t('member.guestLabel', { defaultValue: '一般ユーザー' })}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isAdmin
                  ? t('member.adminDesc', { defaultValue: '会員限定導線を含む全コンテンツの確認が可能です。' })
                  : isMember
                    ? t('member.memberDesc', { defaultValue: '限定コンテンツ・商品の閲覧/購入が可能です。' })
                    : t('member.guestDesc', { defaultValue: '一部コンテンツは Fanclub 参加後に閲覧できます。' })}
              </p>
              <dl className="mt-4 space-y-2 rounded bg-gray-50 p-3 text-xs dark:bg-gray-900/50">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t('member.accountId', { defaultValue: 'アカウントID' })}</dt>
                  <dd className="font-mono text-gray-700 dark:text-gray-200">{user ? maskUserId(user.id) : '-'}</dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t('member.accountEmail', { defaultValue: 'メールアドレス' })}</dt>
                  <dd className="text-gray-700 dark:text-gray-200">{user?.email ?? t('member.emailMissing', { defaultValue: '未設定' })}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">benefits</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {MEMBER_BENEFITS.map((benefit) => (
                  <li key={benefit}>• {t(benefit, { defaultValue: benefit })}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('member.benefitNote', { defaultValue: '最新の会員特典・公開状態は Fanclub / Store の各ページで確認できます。' })}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">progress</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{progressPercent}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('member.progressMeta', { done: progressDone, total: progressTotal, defaultValue: `${progressDone}/${progressTotal} completed` })}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-label={t('member.progressLabel', { defaultValue: 'My page readiness progress' })}>
                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.progressHelp', { defaultValue: '次のアクションを進めることで、限定導線や運用確認の抜け漏れを減らせます。' })}</p>
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">next</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                {NEXT_ACTIONS.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500"
                  >
                    {t(action.key, { defaultValue: action.key })} →
                  </Link>
                ))}
              </div>
              {!isMember && !isAdmin && (
                <p className="mt-3 text-xs text-violet-500">{t('member.joinHint', { defaultValue: 'FC限定商品や先行情報は Fanclub 参加後に利用できます。' })}</p>
              )}
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">quick links</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500"
                  >
                    {t(link.key, { defaultValue: link.key })}
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('member.quickLinksHelp', { defaultValue: '不明点があれば FAQ を確認し、依頼相談は Contact から送信してください。' })}</p>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
            <p className="font-mono text-[11px] text-gray-400">access overview</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.accessLead', { defaultValue: '利用頻度の高い導線について、現在のアクセス状態をまとめています。' })}</p>
            <ul className="mt-4 space-y-3">
              {ACCESS_ITEMS.map((item) => (
                <li key={item.titleKey} className="rounded border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t(item.titleKey, { defaultValue: item.titleKey })}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t(item.descKey, { defaultValue: item.descKey })}</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                      {t(isSignedIn ? item.signedInStatusKey : item.guestStatusKey, { defaultValue: isSignedIn ? item.signedInStatusKey : item.guestStatusKey })}
                    </span>
                  </div>
                  <Link to={item.to} className="mt-3 inline-flex text-xs text-violet-500 hover:text-violet-400">
                    {t(item.actionKey, { defaultValue: item.actionKey })} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
            <p className="font-mono text-[11px] text-gray-400">checklist</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.checklistLead', { defaultValue: '次のアクションを進めると、マイページの活用がスムーズになります。' })}</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {roleTodo.map((todo) => (
                <li key={todo} className="flex gap-2">
                  <span aria-hidden className="text-violet-500">✓</span>
                  <span>{t(todo, { defaultValue: todo })}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
