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

interface SocialAuthProviderStatusProps {
  isSignedIn: boolean
}

function SocialAuthProviderStatusWithClerk({ isSignedIn }: SocialAuthProviderStatusProps) {
  const { t } = useTranslation()
  const { openSignIn } = useClerk()
  const { user } = useUser()
  const linkedProviders = new Set(
    (user?.externalAccounts ?? [])
      .map((account) => account.provider.replace(/^oauth_/, ''))
      .map((provider) => (provider === 'twitter' ? 'x' : provider)),
  )

  const handleSocialSignIn = async () => {
    await openSignIn({
      fallbackRedirectUrl: ROUTES.MEMBER,
      forceRedirectUrl: ROUTES.MEMBER,
    })
  }

  return (
    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
      {SOCIAL_PROVIDER_CONFIG.map((provider) => (
        <li key={provider.id} className="rounded border border-gray-200 px-3 py-2 dark:border-gray-700">
          <div className="flex items-center justify-between gap-2">
            <span>{t(provider.key, { defaultValue: provider.key })}</span>
            {isSignedIn && linkedProviders.has(provider.id) ? (
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
        </li>
      ))}
    </ul>
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
