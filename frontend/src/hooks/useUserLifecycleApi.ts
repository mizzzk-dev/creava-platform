import { useEffect, useState } from 'react'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import { useCurrentUser } from './useCurrentUser'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

export type UserLifecycleApiSummary = {
  onboardingStatus: string
  profileCompletionStatus: string
  lifecycleStage: string
  membershipStatus: string
  accountStatus: string
  accessLevel: string
  entitlementState: string
  subscriptionState: string
  billingState: string
  statusReason: string | null
  statusUpdatedAt: string | null
  firstLoginAt: string | null
  lastLoginAt: string | null
  joinedAt: string | null
  renewedAt: string | null
  canceledAt: string | null
  graceEndsAt: string | null
  suspendedAt: string | null
  reactivatedAt: string | null
  sourceSite: string
}

function resolveApiBaseUrl(): string | null {
  const base = import.meta.env.VITE_STRAPI_API_URL
  return base ? base.replace(/\/$/, '') : null
}

export function useUserLifecycleApi() {
  const auth = useAuthClient()
  const { isSignedIn, user, lifecycle } = useCurrentUser()
  const [summary, setSummary] = useState<UserLifecycleApiSummary | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      setSummary(null)
      return
    }

    const baseUrl = resolveApiBaseUrl()
    if (!baseUrl) {
      setSummary(null)
      return
    }

    let cancelled = false

    auth.getAccessToken()
      .then((token) => {
        if (!token || cancelled) return null
        return fetch(`${baseUrl}/api/user-sync/me`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      })
      .then(async (response) => {
        if (!response || cancelled || !response.ok) return
        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) return
        const json = await response.json() as { lifecycleSummary?: UserLifecycleApiSummary }
        const next = json.lifecycleSummary
        if (next) {
          setSummary(next)
          trackMizzzEvent('account_summary_view', {
            sourceSite: next.sourceSite,
            userState: lifecycle?.lifecycleStage ?? 'unknown',
            membershipStatus: user?.membershipStatus ?? 'unknown',
            entitlementState: next.entitlementState,
            subscriptionState: next.subscriptionState,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setSummary(null)
      })

    return () => {
      cancelled = true
    }
  }, [auth, isSignedIn, lifecycle?.lifecycleStage, user?.membershipStatus])

  return summary
}
