import { trackMizzzEvent } from '@/modules/analytics/tracking'
import type { NotificationPreferenceState, NotificationTheme, SegmentContext } from '@/modules/crm/types'

const KEY = 'creava.notifications.preference-center.v1'

const THEMES: NotificationTheme[] = [
  'fc_update',
  'member_benefit',
  'store_new_arrival',
  'favorite_related',
  'campaign',
  'event',
  'support_important',
]

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function createDefaultPreference(locale: string): NotificationPreferenceState {
  return {
    allInAppEnabled: true,
    allEmailEnabled: true,
    themes: Object.fromEntries(
      THEMES.map((theme) => [theme, {
        inApp: true,
        email: theme !== 'campaign',
        required: theme === 'support_important',
      }]),
    ) as NotificationPreferenceState['themes'],
    updatedAt: new Date().toISOString(),
    locale,
  }
}

export function loadPreferenceCenter(locale: string): NotificationPreferenceState {
  if (!canUseStorage()) return createDefaultPreference(locale)
  const raw = window.localStorage.getItem(KEY)
  if (!raw) return createDefaultPreference(locale)

  try {
    const parsed = JSON.parse(raw) as NotificationPreferenceState
    if (!parsed?.themes) return createDefaultPreference(locale)
    return {
      ...createDefaultPreference(locale),
      ...parsed,
      locale,
    }
  } catch {
    return createDefaultPreference(locale)
  }
}

export function savePreferenceCenter(state: NotificationPreferenceState): NotificationPreferenceState {
  const next = { ...state, updatedAt: new Date().toISOString() }
  if (canUseStorage()) {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  }

  trackMizzzEvent('notification_preference_update', {
    emailOptIn: next.allEmailEnabled,
    inAppOptIn: next.allInAppEnabled,
    locale: next.locale,
  })

  return next
}

export function toSegmentContextPreference(state: NotificationPreferenceState): SegmentContext['notificationPreference'] {
  return state
}

export const notificationThemes = THEMES
