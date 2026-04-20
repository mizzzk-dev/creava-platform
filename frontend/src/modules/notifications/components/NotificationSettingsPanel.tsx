import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks'
import { resolveBenefitExperienceState } from '@/lib/auth/benefitState'
import { buildBenefitPresentation } from '@/lib/auth/benefitPresentation'
import { ROUTES } from '@/lib/routeConstants'
import { trackCtaClick, trackMizzzEvent } from '@/modules/analytics/tracking'
import { useNotificationSubscriptions } from '@/modules/notifications/hooks/useNotificationSubscriptions'

export default function NotificationSettingsPanel({ location }: { location: string }) {
  const { t } = useTranslation()
  const { user, lifecycle } = useCurrentUser()
  const { subscriptions, activeCount, preference, setActive, updatePreference } = useNotificationSubscriptions()
  const benefitState = resolveBenefitExperienceState({ user, lifecycle, sourceSite: 'fc' })
  const benefitPresentation = buildBenefitPresentation(benefitState)

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('common.notificationCenter', { defaultValue: '通知センター' })}</h2>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
          {activeCount}{t('common.notificationActiveCountSuffix', { defaultValue: '件有効' })}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
        <label className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
          <span>{t('common.notifyWeekly', { defaultValue: '今週の更新を受け取る' })}</span>
          <input type="checkbox" checked={preference.weeklyDigest} onChange={(e) => updatePreference({ ...preference, weeklyDigest: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
          <span>{t('common.notifyMembers', { defaultValue: '会員限定更新を受け取る' })}</span>
          <input type="checkbox" checked={preference.memberOnlyUpdates} onChange={(e) => updatePreference({ ...preference, memberOnlyUpdates: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
          <span>{t('common.notifyRestock', { defaultValue: '再入荷通知を受け取る' })}</span>
          <input type="checkbox" checked={preference.storeRestock} onChange={(e) => updatePreference({ ...preference, storeRestock: e.target.checked })} />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
        <p className="font-semibold">{benefitPresentation.title}</p>
        <p className="mt-1">{benefitPresentation.description}</p>
      </div>

      <div className="mt-4 space-y-2">
        {subscriptions.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
              <p className="text-gray-500 dark:text-gray-400">{item.topic} / {item.site}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActive(item.id, item.status !== 'active')
                trackCtaClick(location, 'notification_toggle', { topic: item.topic, next: item.status !== 'active' })
              }}
              className="rounded-full border border-gray-300 px-2.5 py-1 text-[11px] dark:border-gray-600"
            >
              {item.status === 'active' ? t('common.pause', { defaultValue: '停止' }) : t('common.resume', { defaultValue: '再開' })}
            </button>
          </div>
        ))}
        {subscriptions.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t('common.notificationEmpty', { defaultValue: '通知登録はまだありません。商品詳細やマイページから登録できます。' })}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <Link
          to={ROUTES.MEMBER}
          onClick={() => {
            trackMizzzEvent('benefit_prompt_clicked', {
              location,
              sourceSite: 'member',
              cta: benefitPresentation.primaryAction,
              membershipStatus: benefitState.membershipStatus,
              lifecycleStage: benefitState.lifecycleStage,
              entitlementState: benefitState.entitlementState,
              benefitVisibilityState: benefitState.benefitVisibilityState,
            })
          }}
          className="inline-flex text-violet-700 underline dark:text-violet-300"
        >
          {t('memberValue.openBenefitHub', { defaultValue: 'マイページで特典を確認' })}
        </Link>
        <Link to={ROUTES.CONTACT} onClick={() => trackCtaClick(location, 'notification_contact_support')} className="inline-flex text-gray-500 underline dark:text-gray-400">
        {t('common.notificationSupportLink', { defaultValue: '通知に関するお問い合わせ' })}
        </Link>
      </div>
    </article>
  )
}
