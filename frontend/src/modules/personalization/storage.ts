import type {
  FavoriteItem,
  MemberNotificationItem,
  PersonalizationEntityRef,
  ViewHistoryItem,
} from './types'

const FAVORITES_KEY = 'creava.personalization.favorites'
const HISTORY_KEY = 'creava.personalization.history'
const NOTIFICATIONS_KEY = 'creava.personalization.notifications'
const MAX_HISTORY = 60
const MAX_FAVORITES = 120

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`
}

export function loadFavorites(): FavoriteItem[] {
  if (!canUseStorage()) return []
  return safeParse<FavoriteItem[]>(window.localStorage.getItem(FAVORITES_KEY), [])
}

export function isFavorited(kind: PersonalizationEntityRef['kind'], slug: string): boolean {
  return loadFavorites().some((item) => item.kind === kind && item.slug === slug)
}

export function toggleFavorite(input: PersonalizationEntityRef, userId?: string | null): { active: boolean; item: FavoriteItem } {
  const current = loadFavorites()
  const now = new Date().toISOString()
  const existing = current.find((item) => item.kind === input.kind && item.slug === input.slug)
  if (existing) {
    const next = current.filter((item) => !(item.kind === input.kind && item.slug === input.slug))
    if (canUseStorage()) window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    return { active: false, item: { ...existing, updatedAt: now } }
  }

  const created: FavoriteItem = {
    id: genId('fav'),
    ...input,
    createdAt: now,
    updatedAt: now,
    userId: userId ?? null,
  }
  const next = [created, ...current].slice(0, MAX_FAVORITES)
  if (canUseStorage()) window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  return { active: true, item: created }
}

export function loadViewHistory(): ViewHistoryItem[] {
  if (!canUseStorage()) return []
  return safeParse<ViewHistoryItem[]>(window.localStorage.getItem(HISTORY_KEY), [])
}

export function trackView(input: PersonalizationEntityRef, userId?: string | null): ViewHistoryItem {
  const current = loadViewHistory()
  const now = new Date().toISOString()
  const nextItem: ViewHistoryItem = {
    id: genId('hist'),
    ...input,
    viewedAt: now,
    userId: userId ?? null,
  }

  const deduped = current.filter((item) => !(item.kind === input.kind && item.slug === input.slug))
  const next = [nextItem, ...deduped].slice(0, MAX_HISTORY)
  if (canUseStorage()) window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return nextItem
}

export function removeHistoryItem(id: string): void {
  const next = loadViewHistory().filter((item) => item.id !== id)
  if (canUseStorage()) window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function seedNotifications(): MemberNotificationItem[] {
  return [
    {
      id: 'seed_fc_update',
      type: 'fc_update',
      priority: 'high',
      sourceSite: 'fc',
      category: 'member',
      title: 'FC限定コンテンツが更新されました',
      body: '今週の限定動画・ギャラリーが公開されました。',
      href: '/mypage',
      isRead: false,
      createdAt: new Date().toISOString(),
      readAt: null,
      userId: null,
    },
  ]
}

export function loadNotifications(): MemberNotificationItem[] {
  if (!canUseStorage()) return []
  const raw = safeParse<MemberNotificationItem[]>(window.localStorage.getItem(NOTIFICATIONS_KEY), [])
  if (raw.length > 0) return raw
  const seeded = seedNotifications()
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(seeded))
  return seeded
}

export function pushNotification(notification: Omit<MemberNotificationItem, 'id' | 'createdAt' | 'isRead' | 'readAt'>): MemberNotificationItem {
  const created: MemberNotificationItem = {
    ...notification,
    id: genId('notice'),
    createdAt: new Date().toISOString(),
    isRead: false,
    readAt: null,
  }
  const next = [created, ...loadNotifications()].slice(0, 100)
  if (canUseStorage()) window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next))
  return created
}

export function markNotificationRead(id: string, isRead: boolean): void {
  const next = loadNotifications().map((item) => (item.id === id ? { ...item, isRead, readAt: isRead ? new Date().toISOString() : null } : item))
  if (canUseStorage()) window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next))
}
