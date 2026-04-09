import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
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
    <motion.div
      className="py-16 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-500/40 mb-3">
        // 404_not_found
      </p>
      <p className="text-sm text-gray-500 dark:text-[rgba(180,190,220,0.5)]">{t('common.notFound')}</p>
      <Link
        to={backTo ?? ROUTES.HOME}
        className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-500/50 transition-colors hover:text-cyan-400"
      >
        ← {t('detail.backToList')}
      </Link>
    </motion.div>
  )
}
