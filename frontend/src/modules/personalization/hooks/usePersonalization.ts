import { useMemo, useState } from 'react'
import {
  isFavorited,
  loadFavorites,
  loadNotifications,
  loadViewHistory,
  markNotificationRead,
  pushNotification,
  removeHistoryItem,
  toggleFavorite,
  trackView,
} from '../storage'
import type { MemberNotificationItem, PersonalizationEntityRef } from '../types'

export function usePersonalization(userId?: string | null) {
  const [favorites, setFavorites] = useState(loadFavorites)
  const [history, setHistory] = useState(loadViewHistory)
  const [notifications, setNotifications] = useState(loadNotifications)

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications])

  const toggleFavoriteItem = (input: PersonalizationEntityRef) => {
    const result = toggleFavorite(input, userId)
    setFavorites(loadFavorites())
    if (result.active) {
      pushNotification({
        type: 'mypage',
        priority: 'normal',
        sourceSite: input.sourceSite,
        category: input.kind,
        title: 'お気に入りに追加しました',
        body: `${input.title} を保存しました。`,
        href: input.href,
        userId: userId ?? null,
      })
      setNotifications(loadNotifications())
    }
    return result
  }

  return {
    favorites,
    history,
    notifications,
    unreadCount,
    isFavorited,
    toggleFavoriteItem,
    trackViewItem: (input: PersonalizationEntityRef) => {
      trackView(input, userId)
      setHistory(loadViewHistory())
    },
    removeHistoryItem: (id: string) => {
      removeHistoryItem(id)
      setHistory(loadViewHistory())
    },
    markNotificationRead: (id: string, isRead: boolean) => {
      markNotificationRead(id, isRead)
      setNotifications(loadNotifications())
    },
    addNotification: (notification: Omit<MemberNotificationItem, 'id' | 'createdAt' | 'isRead' | 'readAt'>) => {
      pushNotification(notification)
      setNotifications(loadNotifications())
    },
  }
}
