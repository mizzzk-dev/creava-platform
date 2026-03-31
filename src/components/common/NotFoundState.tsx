import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'

interface Props {
  /** 「一覧に戻る」リンクの遷移先（省略時はホームへ） */
  backTo?: string
}

/**
 * コンテンツが見つからない場合の表示
 */
export default function NotFoundState({ backTo }: Props) {
  const { t } = useTranslation()

  return (
    <div className="py-16 text-center">
      <p className="text-sm text-gray-500">{t('common.notFound')}</p>
      <Link
        to={backTo ?? ROUTES.HOME}
        className="mt-4 inline-block text-sm text-gray-400 underline underline-offset-4 transition-colors hover:text-gray-700"
      >
        {t('detail.backToList')}
      </Link>
    </div>
  )
}
