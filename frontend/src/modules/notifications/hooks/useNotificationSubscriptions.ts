import { useMemo, useState } from 'react'
import type { NotificationPreference, NotificationSubscription } from '../types'
import {
  loadNotificationPreference,
  loadNotificationSubscriptions,
  saveNotificationPreference,
  toggleNotificationSubscription,
  upsertNotificationSubscription,
} from '../storage'

export function useNotificationSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>(() => loadNotificationSubscriptions())
  const [preference, setPreference] = useState<NotificationPreference>(() => loadNotificationPreference())

  const activeCount = useMemo(() => subscriptions.filter((item) => item.status === 'active').length, [subscriptions])

  const subscribe = (payload: Omit<NotificationSubscription, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const result = upsertNotificationSubscription(payload)
    setSubscriptions(loadNotificationSubscriptions())
    return result
  }

  const setActive = (id: string, active: boolean) => {
    const result = toggleNotificationSubscription(id, active)
    setSubscriptions(loadNotificationSubscriptions())
    return result
  }

  const updatePreference = (next: NotificationPreference) => {
    saveNotificationPreference(next)
    setPreference(next)
  }

  return {
    subscriptions,
    activeCount,
    preference,
    subscribe,
    setActive,
    updatePreference,
  }
}
