import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import { loadPreferenceCenter, notificationThemes, savePreferenceCenter } from '@/modules/notifications/preferences'
import type { NotificationTheme } from '@/modules/crm/types'

const THEME_LABELS: Record<NotificationTheme, string> = {
  fc_update: 'notificationPreference.themeFcUpdate',
  member_benefit: 'notificationPreference.themeMemberBenefit',
  store_new_arrival: 'notificationPreference.themeStoreNewArrival',
  favorite_related: 'notificationPreference.themeFavoriteRelated',
  campaign: 'notificationPreference.themeCampaign',
  event: 'notificationPreference.themeEvent',
  support_important: 'notificationPreference.themeSupportImportant',
}

export default function NotificationPreferenceCenter({ location }: { location: string }) {
  const { t, i18n } = useTranslation()
  const [state, setState] = useState(() => loadPreferenceCenter(i18n.language || 'ja'))

  const optionalThemes = useMemo(() => notificationThemes.filter((theme) => !state.themes[theme].required), [state.themes])

  const persist = (updater: (prev: typeof state) => typeof state) => {
    const next = savePreferenceCenter(updater(state))
    setState(next)
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('notificationPreference.title')}</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('notificationPreference.description')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            trackMizzzEvent('notification_preference_open', { location })
          }}
          className="rounded-full border border-gray-300 px-3 py-1 text-[11px] text-gray-600 dark:border-gray-700 dark:text-gray-300"
        >
          {t('notificationPreference.trackingBadge')}
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
          <span>{t('notificationPreference.enableAllInApp')}</span>
          <input
            type="checkbox"
            checked={state.allInAppEnabled}
            onChange={(event) => {
              const checked = event.target.checked
              persist((prev) => ({
                ...prev,
                allInAppEnabled: checked,
                themes: Object.fromEntries(
                  notificationThemes.map((theme) => [theme, {
                    ...prev.themes[theme],
                    inApp: prev.themes[theme].required ? true : checked,
                  }]),
                ) as typeof prev.themes,
              }))
              trackMizzzEvent(checked ? 'in_app_opt_in' : 'in_app_opt_out', { location })
            }}
          />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
          <span>{t('notificationPreference.enableAllEmail')}</span>
          <input
            type="checkbox"
            checked={state.allEmailEnabled}
            onChange={(event) => {
              const checked = event.target.checked
              persist((prev) => ({
                ...prev,
                allEmailEnabled: checked,
                themes: Object.fromEntries(
                  notificationThemes.map((theme) => [theme, {
                    ...prev.themes[theme],
                    email: prev.themes[theme].required ? true : checked,
                  }]),
                ) as typeof prev.themes,
              }))
              trackMizzzEvent(checked ? 'email_opt_in' : 'email_opt_out', { location })
            }}
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {notificationThemes.map((theme) => (
          <div key={theme} className="rounded-lg border border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-gray-800 dark:text-gray-100">{t(THEME_LABELS[theme])}</p>
              {state.themes[theme].required && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('notificationPreference.required')}
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between rounded border border-gray-200 px-2 py-1 dark:border-gray-700">
                <span>In-App</span>
                <input
                  type="checkbox"
                  checked={state.themes[theme].inApp}
                  disabled={state.themes[theme].required}
                  onChange={(event) => {
                    const checked = event.target.checked
                    persist((prev) => ({
                      ...prev,
                      themes: { ...prev.themes, [theme]: { ...prev.themes[theme], inApp: checked } },
                    }))
                  }}
                />
              </label>
              <label className="flex items-center justify-between rounded border border-gray-200 px-2 py-1 dark:border-gray-700">
                <span>Email</span>
                <input
                  type="checkbox"
                  checked={state.themes[theme].email}
                  disabled={state.themes[theme].required}
                  onChange={(event) => {
                    const checked = event.target.checked
                    persist((prev) => ({
                      ...prev,
                      themes: { ...prev.themes, [theme]: { ...prev.themes[theme], email: checked } },
                    }))
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <p>{t('notificationPreference.unsubscribeHint')}</p>
        <p className="mt-1">{t('notificationPreference.optionalCount', { count: optionalThemes.length })}</p>
        <Link
          to={ROUTES.LEGAL_PRIVACY}
          onClick={() => trackMizzzEvent('unsubscribe_click', { location })}
          className="mt-2 inline-flex underline"
        >
          {t('notificationPreference.unsubscribeLink')}
        </Link>
      </div>
    </section>
  )
}
