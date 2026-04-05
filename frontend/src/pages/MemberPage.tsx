import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'

const MEMBER_BENEFITS = [
  '限定コンテンツ先行公開',
  'Store の会員限定商品案内',
  'イベント先行案内',
]

export default function MemberPage() {
  const { t } = useTranslation()
  const { user, isLoaded, isSignedIn } = useCurrentUser()
  const isMember = user?.role === 'member'

  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <PageHead title={t('member.title', { defaultValue: 'マイページ' })} description={t('member.description', { defaultValue: '会員状態と特典を確認できます。' })} />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('member.title', { defaultValue: 'マイページ' })}</h1>

      {!isLoaded && <p className="mt-4 text-sm text-gray-500">{t('common.loading')}</p>}

      {isLoaded && !isSignedIn && (
        <div className="mt-6 rounded border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('member.signInPrompt', { defaultValue: '会員情報を見るにはログインしてください。' })}</p>
          <Link to={ROUTES.FANCLUB} className="mt-3 inline-flex text-sm text-violet-500 hover:text-violet-400">{t('home.fanclub.joinButton')} →</Link>
        </div>
      )}

      {isLoaded && isSignedIn && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-200 dark:border-gray-800 p-5">
            <p className="font-mono text-[11px] text-gray-400">status</p>
            <p className="mt-2 text-xl font-medium text-gray-900 dark:text-gray-100">{isMember ? t('member.memberLabel', { defaultValue: 'FC会員' }) : t('member.guestLabel', { defaultValue: '一般ユーザー' })}</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{isMember ? t('member.memberDesc', { defaultValue: '限定コンテンツ・商品の閲覧/購入が可能です。' }) : t('member.guestDesc', { defaultValue: '一部コンテンツは Fanclub 参加後に閲覧できます。' })}</p>
          </div>

          <div className="rounded border border-gray-200 dark:border-gray-800 p-5">
            <p className="font-mono text-[11px] text-gray-400">benefits</p>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {MEMBER_BENEFITS.map((benefit) => (
                <li key={benefit}>• {benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
