import { useMemo, useState } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'

type SocialProviderId = 'google' | 'apple' | 'x' | 'facebook'

interface SocialProviderConfig {
  id: SocialProviderId
  key: string
  enabled: boolean
}

const SOCIAL_PROVIDER_CONFIG: SocialProviderConfig[] = [
  {
    id: 'google',
    key: 'member.authGoogle',
    enabled: import.meta.env.VITE_CLERK_SOCIAL_GOOGLE_ENABLED === 'true',
  },
  {
    id: 'apple',
    key: 'member.authApple',
    enabled: import.meta.env.VITE_CLERK_SOCIAL_APPLE_ENABLED === 'true',
  },
  {
    id: 'x',
    key: 'member.authX',
    enabled: import.meta.env.VITE_CLERK_SOCIAL_X_ENABLED === 'true',
  },
  {
    id: 'facebook',
    key: 'member.authFacebook',
    enabled: import.meta.env.VITE_CLERK_SOCIAL_FACEBOOK_ENABLED === 'true',
  },
]

const PROVIDER_TO_STRATEGY: Record<SocialProviderId, 'oauth_google' | 'oauth_apple' | 'oauth_x' | 'oauth_facebook'> = {
  google: 'oauth_google',
  apple: 'oauth_apple',
  x: 'oauth_x',
  facebook: 'oauth_facebook',
}

interface SocialAuthProviderStatusProps {
  isSignedIn: boolean
}

function SocialAuthProviderStatusWithClerk({ isSignedIn }: SocialAuthProviderStatusProps) {
  const { t } = useTranslation()
  const { openSignIn } = useClerk()
  const { user } = useUser()
  const [pendingProviderId, setPendingProviderId] = useState<SocialProviderId | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)

  const linkedProviderMap = useMemo(() => {
    return new Map(
      (user?.externalAccounts ?? []).map((account) => {
        const provider = account.provider.replace(/^oauth_/, '')
        const normalizedProvider = provider === 'twitter' ? 'x' : provider
        return [normalizedProvider, account]
      }),
    )
  }, [user?.externalAccounts])

  const handleSocialSignIn = async () => {
    await openSignIn({
      fallbackRedirectUrl: ROUTES.MEMBER,
      forceRedirectUrl: ROUTES.MEMBER,
    })
  }

  const handleLinkProvider = async (providerId: SocialProviderId) => {
    if (!user) return

    setOperationError(null)
    setPendingProviderId(providerId)

    try {
      await user.createExternalAccount({
        strategy: PROVIDER_TO_STRATEGY[providerId],
        redirectUrl: window.location.href,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('member.authOperationFailed', { defaultValue: '連携操作に失敗しました。時間をおいて再試行してください。' })
      setOperationError(message)
    } finally {
      setPendingProviderId(null)
    }
  }

  const handleUnlinkProvider = async (providerId: SocialProviderId) => {
    const externalAccount = linkedProviderMap.get(providerId)
    if (!externalAccount || !user) return

    setOperationError(null)
    setPendingProviderId(providerId)

    try {
      await externalAccount.destroy()
      await user.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('member.authOperationFailed', { defaultValue: '連携操作に失敗しました。時間をおいて再試行してください。' })
      setOperationError(message)
    } finally {
      setPendingProviderId(null)
    }
  }

  return (
    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <ul className="space-y-2">
        {SOCIAL_PROVIDER_CONFIG.map((provider) => {
          const isLinked = linkedProviderMap.has(provider.id)
          const isPending = pendingProviderId === provider.id

          return (
            <li key={provider.id} className="rounded border border-gray-200 px-3 py-2 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <span>{t(provider.key, { defaultValue: provider.key })}</span>
                {isSignedIn && isLinked ? (
                  <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    {t('member.authLinked', { defaultValue: '連携済み' })}
                  </span>
                ) : provider.enabled ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {t('member.authAvailable', { defaultValue: '対応' })}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {t('member.authSetupRequired', { defaultValue: '要設定' })}
                  </span>
                )}
              </div>

              {!isSignedIn && provider.enabled && (
                <button
                  type="button"
                  className="mt-2 text-xs text-violet-500 hover:text-violet-400"
                  onClick={() => {
                    void handleSocialSignIn()
                  }}
                >
                  {t('member.authTrySignIn', { defaultValue: 'この方法でログインする' })}
                </button>
              )}

              {isSignedIn && provider.enabled && !isLinked && (
                <button
                  type="button"
                  disabled={isPending}
                  className="mt-2 rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                  onClick={() => {
                    void handleLinkProvider(provider.id)
                  }}
                >
                  {isPending
                    ? t('member.authLinking', { defaultValue: '連携中…' })
                    : t('member.authLinkAction', { defaultValue: 'この方法を連携する' })}
                </button>
              )}

              {isSignedIn && provider.enabled && isLinked && (
                <button
                  type="button"
                  disabled={isPending}
                  className="mt-2 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  onClick={() => {
                    void handleUnlinkProvider(provider.id)
                  }}
                >
                  {isPending
                    ? t('member.authUnlinking', { defaultValue: '解除中…' })
                    : t('member.authUnlinkAction', { defaultValue: '連携を解除する' })}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
        {operationError || t('member.authOperationHint', { defaultValue: '連携後はこの画面に戻ると状態が反映されます。' })}
      </p>
    </div>
  )
}

function SocialAuthProviderStatusNoClerk() {
  const { t } = useTranslation()

  return (
    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
      {SOCIAL_PROVIDER_CONFIG.map((provider) => (
        <li key={provider.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 dark:border-gray-700">
          <span>{t(provider.key, { defaultValue: provider.key })}</span>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {t('member.authUnavailable', { defaultValue: 'Clerk未設定' })}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  ? SocialAuthProviderStatusWithClerk
  : SocialAuthProviderStatusNoClerk
