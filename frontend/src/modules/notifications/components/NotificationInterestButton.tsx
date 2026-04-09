import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NotificationTopic } from '@/modules/notifications/types'
import { trackCtaClick, trackMizzzEvent } from '@/modules/analytics/tracking'
import { useNotificationSubscriptions } from '@/modules/notifications/hooks/useNotificationSubscriptions'

interface Props {
  location: string
  topic: NotificationTopic
  site: 'store' | 'fanclub' | 'cross'
  targetType: 'product' | 'campaign' | 'content' | 'digest'
  targetId: string
  title: string
  description?: string
  defaultLabel?: string
}

export default function NotificationInterestButton({
  location,
  topic,
  site,
  targetType,
  targetId,
  title,
  description,
  defaultLabel,
}: Props) {
  const { t } = useTranslation()
  const { subscriptions, subscribe } = useNotificationSubscriptions()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const exists = useMemo(
    () => subscriptions.some((item) => item.topic === topic && item.targetId === targetId && item.status === 'active'),
    [subscriptions, targetId, topic],
  )

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={exists}
        onClick={() => {
          try {
            subscribe({
              topic,
              channel: 'in_app',
              site,
              targetType,
              targetId,
              title,
              description,
            })
            setStatus('success')
            trackCtaClick(location, 'notification_subscribe', { topic, targetType, site })
            trackMizzzEvent('notification_subscribe_success', { topic, targetType, site })
          } catch {
            setStatus('error')
            trackMizzzEvent('notification_subscribe_error', { topic, targetType, site })
          }
        }}
        className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-50 disabled:text-emerald-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:disabled:border-emerald-800 dark:disabled:bg-emerald-950/30 dark:disabled:text-emerald-300"
      >
        {exists
          ? t('common.notificationRegistered', { defaultValue: '通知登録済み' })
          : defaultLabel ?? t('common.notificationCta', { defaultValue: 'お知らせを受け取る' })}
      </button>
      {status === 'success' && !exists && (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
          {t('common.notificationRegisteredMessage', { defaultValue: '通知登録を受け付けました。マイページから設定を確認できます。' })}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
          {t('common.notificationErrorMessage', { defaultValue: '通知登録に失敗しました。時間をおいて再試行してください。' })}
        </p>
      )}
    </div>
  )
}
