import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks'
import { fanclubLink, storeLink } from '@/lib/siteLinks'
import { ROUTES } from '@/lib/routeConstants'
import { resolveBenefitExperienceState } from '@/lib/auth/benefitState'
import { resolveCampaignPersonalizationState } from '@/lib/auth/campaignPersonalizationState'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import { usePersonalization } from '../hooks/usePersonalization'

export default function MyPagePersonalizationPanel() {
  const { t } = useTranslation()
  const { user, lifecycle } = useCurrentUser()
  const benefitState = resolveBenefitExperienceState({ user, lifecycle, sourceSite: 'fc' })
  const campaignState = resolveCampaignPersonalizationState({ user, lifecycle, sourceSite: 'member' })

  const {
    favorites,
    history,
    notifications,
    unreadCount,
    removeHistoryItem,
    markNotificationRead,
  } = usePersonalization(user?.id)

  const topCategories = useMemo(() => {
    const counter = new Map<string, number>()
    favorites.forEach((item) => {
      counter.set(item.kind, (counter.get(item.kind) ?? 0) + 1)
    })
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [favorites])

  const crossSiteLinks = [
    { label: t('member.crossToStore', { defaultValue: 'Storeのおすすめを見る' }), to: storeLink('/products') },
    { label: t('member.crossToFanclub', { defaultValue: 'Fanclubの更新を見る' }), to: fanclubLink('/mypage') },
    { label: t('member.crossToMain', { defaultValue: 'Mainの最新Newsを見る' }), to: ROUTES.NEWS },
  ]

  return (
    <section onMouseEnter={() => trackMizzzEvent('benefit_hub_view', { sourceSite: 'member', membershipStatus: benefitState.membershipStatus, entitlementState: benefitState.entitlementState, benefitVisibilityState: benefitState.benefitVisibilityState })} className="rounded border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('member.personalizationTitle', { defaultValue: 'お気に入り / 閲覧履歴 / 通知センター' })}
        </h2>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          {t('member.unreadCount', { count: unreadCount, defaultValue: `未読 ${unreadCount} 件` })}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t('member.favoriteListTitle', { defaultValue: 'お気に入り' })}</p>
          {favorites.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {favorites.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link to={item.href} className="text-gray-600 underline dark:text-gray-300">
                    [{item.sourceSite}] {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('member.favoriteEmpty', { defaultValue: 'まだ保存された項目はありません。' })}</p>
          )}
        </article>

        <article className="rounded border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t('member.historyListTitle', { defaultValue: '最近見た項目' })}</p>
          {history.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {history.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <Link to={item.href} className="truncate text-gray-600 underline dark:text-gray-300">
                    [{item.sourceSite}] {item.title}
                  </Link>
                  <button type="button" onClick={() => removeHistoryItem(item.id)} className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    {t('common.delete', { defaultValue: '削除' })}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('member.historyEmpty', { defaultValue: '最近見た項目はまだありません。' })}</p>
          )}
        </article>

        <article className="rounded border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t('member.notificationCenterTitle', { defaultValue: '通知センター' })}</p>
          {notifications.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {notifications.slice(0, 6).map((item) => (
                <li key={item.id} className="rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.title}</p>
                    {item.priority === 'high' && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">重要</span>}
                  </div>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">{item.body}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400">{item.sourceSite} / {item.category}</span>
                    <button type="button" onClick={() => markNotificationRead(item.id, !item.isRead)} className="text-[10px] text-violet-600 underline dark:text-violet-300">
                      {item.isRead ? '未読に戻す' : '既読にする'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('member.notificationEmpty', { defaultValue: '通知はまだありません。' })}</p>
          )}
        </article>
      </div>

      <div className="mt-3 rounded border border-violet-200 bg-violet-50/60 p-3 text-xs text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-200">
        {t('memberValue.hubSummary', { defaultValue: '現在の特典表示: {{visibility}} / 先行公開: {{early}}', visibility: benefitState.benefitVisibilityState, early: benefitState.earlyAccessState })}
        <p className="mt-2">施策状態: {campaignState.campaignEligibilityState} / 表示優先度: {campaignState.offerVisibilityState} / 次アクション: {campaignState.nextBestActionLabel}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t('member.topCategoryTitle', { defaultValue: 'よく保存するカテゴリ' })}</p>
          {topCategories.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2 text-xs">
              {topCategories.map(([key, count]) => (
                <li key={key} className="rounded-full border border-violet-200 px-2 py-0.5 text-violet-700 dark:border-violet-800 dark:text-violet-300">{key} ×{count}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('member.topCategoryEmpty', { defaultValue: '保存データが増えると表示されます。' })}</p>
          )}
        </article>

        <article className="rounded border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t('member.crossSiteTitle', { defaultValue: '横断パーソナライズ導線' })}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {crossSiteLinks.map((item) => (
              <Link key={item.label} to={item.to} className="rounded-full border border-gray-300 px-2 py-1 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {item.label}
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
