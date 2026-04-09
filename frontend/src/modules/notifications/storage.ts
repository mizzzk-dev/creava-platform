import { trackMizzzEvent } from '@/modules/analytics/tracking'
import type { NotificationPreference, NotificationSubscription } from './types'
import { DEFAULT_NOTIFICATION_PREFERENCE } from './types'

const SUBSCRIPTIONS_KEY = 'creava.notifications.subscriptions'
const PREFERENCES_KEY = 'creava.notifications.preferences'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadNotificationSubscriptions(): NotificationSubscription[] {
  if (!canUseStorage()) return []

  const raw = window.localStorage.getItem(SUBSCRIPTIONS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is NotificationSubscription => Boolean(item?.id && item?.topic && item?.targetId && item?.title))
  } catch {
    return []
  }
}

function saveNotificationSubscriptions(subscriptions: NotificationSubscription[]): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions))
}

export function upsertNotificationSubscription(input: Omit<NotificationSubscription, 'id' | 'createdAt' | 'updatedAt' | 'status'>): NotificationSubscription {
  const current = loadNotificationSubscriptions()
  const now = new Date().toISOString()
  const existing = current.find((item) => item.topic === input.topic && item.targetId === input.targetId && item.channel === input.channel)

  if (existing) {
    const updated: NotificationSubscription = {
      ...existing,
      ...input,
      status: 'active',
      updatedAt: now,
    }
    const next = current.map((item) => (item.id === updated.id ? updated : item))
    saveNotificationSubscriptions(next)
    trackMizzzEvent('notification_subscription_updated', { topic: input.topic, targetType: input.targetType, site: input.site })
    return updated
  }

  const created: NotificationSubscription = {
    ...input,
    id: `${input.topic}:${input.targetId}:${input.channel}`,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  saveNotificationSubscriptions([created, ...current])
  trackMizzzEvent('notification_subscription_created', { topic: input.topic, targetType: input.targetType, site: input.site })
  return created
}

export function toggleNotificationSubscription(id: string, active: boolean): NotificationSubscription | null {
  const current = loadNotificationSubscriptions()
  const target = current.find((item) => item.id === id)
  if (!target) return null

  const updated: NotificationSubscription = {
    ...target,
    status: active ? 'active' : 'paused',
    updatedAt: new Date().toISOString(),
  }

  saveNotificationSubscriptions(current.map((item) => (item.id === id ? updated : item)))
  trackMizzzEvent('notification_subscription_toggled', {
    topic: target.topic,
    targetType: target.targetType,
    site: target.site,
    active,
  })
  return updated
}

export function loadNotificationPreference(): NotificationPreference {
  if (!canUseStorage()) return DEFAULT_NOTIFICATION_PREFERENCE

  const raw = window.localStorage.getItem(PREFERENCES_KEY)
  if (!raw) return DEFAULT_NOTIFICATION_PREFERENCE

  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPreference>
    return {
      weeklyDigest: typeof parsed.weeklyDigest === 'boolean' ? parsed.weeklyDigest : DEFAULT_NOTIFICATION_PREFERENCE.weeklyDigest,
      memberOnlyUpdates: typeof parsed.memberOnlyUpdates === 'boolean' ? parsed.memberOnlyUpdates : DEFAULT_NOTIFICATION_PREFERENCE.memberOnlyUpdates,
      storeRestock: typeof parsed.storeRestock === 'boolean' ? parsed.storeRestock : DEFAULT_NOTIFICATION_PREFERENCE.storeRestock,
      campaignReminder: typeof parsed.campaignReminder === 'boolean' ? parsed.campaignReminder : DEFAULT_NOTIFICATION_PREFERENCE.campaignReminder,
    }
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCE
  }
}

export function saveNotificationPreference(preference: NotificationPreference): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preference))
  trackMizzzEvent('notification_preference_saved', {
    weeklyDigest: preference.weeklyDigest,
    memberOnlyUpdates: preference.memberOnlyUpdates,
    storeRestock: preference.storeRestock,
    campaignReminder: preference.campaignReminder,
  })
}
