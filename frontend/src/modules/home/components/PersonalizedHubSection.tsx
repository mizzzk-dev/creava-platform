import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useProductList } from '@/modules/store/hooks/useProductList'
import { useHomeLatest } from '@/modules/home/hooks/useHomeLatest'
import { useCurrentUser } from '@/hooks'
import { detailPath, ROUTES } from '@/lib/routeConstants'
import {
  getPersonalizedArticles,
  getPersonalizedProducts,
  type MemberSegment,
} from '@/modules/store/lib/commerceOptimization'

export default function PersonalizedHubSection() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const { products, loading: productLoading } = useProductList(12)
  const { news, blog } = useHomeLatest()

  const segment: MemberSegment = user?.role === 'admin' ? 'admin' : user?.role === 'member' ? 'member' : 'guest'
  const picks = getPersonalizedProducts(products, segment, 3)
  const articlePicks = getPersonalizedArticles(news.items, blog.items, 4)

  return (
    <motion.section
      className="px-4 py-16"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-5xl rounded-2xl border border-violet-200/40 bg-violet-50/40 p-6 dark:border-violet-900/40 dark:bg-violet-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-violet-500">for you</p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('home.personalized.title', { defaultValue: 'あなた向けレコメンド' })}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t('home.personalized.lead', { defaultValue: '閲覧履歴と会員属性から、商品・記事をホームに最適表示します。' })}
            </p>
          </div>
          <Link to={ROUTES.MEMBER} className="text-xs font-mono text-violet-500 hover:text-violet-400">
            {t('home.personalized.manage', { defaultValue: '通知設定を確認' })} →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-200 bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">products</p>
            {productLoading ? (
              <p className="mt-2 text-xs text-gray-500">{t('common.loading')}</p>
            ) : picks.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {picks.map((product) => (
                  <li key={product.id}>
                    <Link to={detailPath.product(product.slug)} className="text-sm text-gray-700 hover:text-violet-500 dark:text-gray-300 dark:hover:text-violet-400">
                      {product.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-500">{t('home.personalized.emptyProducts', { defaultValue: 'おすすめ商品を準備中です。' })}</p>
            )}
          </div>

          <div className="rounded border border-gray-200 bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">articles</p>
            {news.loading || blog.loading ? (
              <p className="mt-2 text-xs text-gray-500">{t('common.loading')}</p>
            ) : articlePicks.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {articlePicks.map((article) => {
                  const to = 'tags' in article ? detailPath.blog(article.slug) : detailPath.news(article.slug)
                  return (
                    <li key={article.documentId}>
                      <Link to={to} className="text-sm text-gray-700 hover:text-violet-500 dark:text-gray-300 dark:hover:text-violet-400">
                        {article.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-500">{t('home.personalized.emptyArticles', { defaultValue: 'おすすめ記事を準備中です。' })}</p>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
