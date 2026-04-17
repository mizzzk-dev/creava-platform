import { useTranslation } from 'react-i18next'
import { useAuthClient } from '@/lib/auth/AuthProvider'

type SocialProviderId = 'google' | 'apple' | 'x' | 'facebook'

interface SocialProviderConfig {
  id: SocialProviderId
  key: string
  enabled: boolean
}

const SOCIAL_PROVIDER_CONFIG: SocialProviderConfig[] = [
  { id: 'google', key: 'member.authGoogle', enabled: import.meta.env.VITE_LOGTO_SOCIAL_GOOGLE_ENABLED === 'true' },
  { id: 'apple', key: 'member.authApple', enabled: import.meta.env.VITE_LOGTO_SOCIAL_APPLE_ENABLED === 'true' },
  { id: 'x', key: 'member.authX', enabled: import.meta.env.VITE_LOGTO_SOCIAL_X_ENABLED === 'true' },
  { id: 'facebook', key: 'member.authFacebook', enabled: import.meta.env.VITE_LOGTO_SOCIAL_FACEBOOK_ENABLED === 'true' },
]

interface SocialAuthProviderStatusProps {
  isSignedIn: boolean
}

export default function SocialAuthProviderStatus({ isSignedIn }: SocialAuthProviderStatusProps) {
  const { t } = useTranslation()
  const { signIn, isEnabled } = useAuthClient()

  return (
    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <ul className="space-y-2">
        {SOCIAL_PROVIDER_CONFIG.map((provider) => (
          <li key={provider.id} className="rounded border border-gray-200 px-3 py-2 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <span>{t(provider.key, { defaultValue: provider.key })}</span>
              {!isEnabled ? (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {t('member.authUnavailable', { defaultValue: '認証未設定' })}
                </span>
              ) : provider.enabled ? (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {isSignedIn
                    ? t('member.authLinked', { defaultValue: '有効' })
                    : t('member.authAvailable', { defaultValue: '対応' })}
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('member.authSetupRequired', { defaultValue: '要設定' })}
                </span>
              )}
            </div>

            {!isSignedIn && provider.enabled && isEnabled && (
              <button
                type="button"
                className="mt-2 text-xs text-violet-500 hover:text-violet-400"
                onClick={() => { void signIn('/member') }}
              >
                {t('member.authTrySignIn', { defaultValue: 'この方法でログインする' })}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
        {t('member.authOperationHint', { defaultValue: 'Logto 側の Sign-in Experience 設定と表示を一致させてください。' })}
      </p>
    </div>
  )
}

