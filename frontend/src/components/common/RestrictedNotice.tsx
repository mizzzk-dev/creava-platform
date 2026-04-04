import { useTranslation } from 'react-i18next'

interface Props {
  /** 制限の種類 */
  variant: 'not_signed_in' | 'not_member'
  /** 未ログイン時のサインインコールバック（variant='not_signed_in' の場合に使用） */
  onSignIn?: () => void
}

/**
 * アクセス制限を案内する共通コンポーネント
 *
 * - not_signed_in: 未ログイン向けにログイン誘導を表示
 * - not_member:    ログイン済みだが会員でない向けに案内を表示
 */
export default function RestrictedNotice({ variant, onSignIn }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 px-6 py-10 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
        {variant === 'not_signed_in' ? '🔒 restricted' : '⭐ members only'}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {variant === 'not_signed_in'
          ? t('access.notSignedIn')
          : t('access.notMember')}
      </p>

      {variant === 'not_signed_in' && onSignIn && (
        <button
          onClick={onSignIn}
          className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300 underline underline-offset-4 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
        >
          {t('auth.signIn')}
        </button>
      )}
    </div>
  )
}
