import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'

interface PlanRow {
  service: string
  items: { name: string; price: string; note?: string }[]
}

const PLANS: PlanRow[] = [
  {
    service: '映像制作',
    items: [
      { name: 'MV / Short Film', price: '¥150,000〜', note: '1〜3分 / 撮影・編集込み' },
      { name: 'CM / Promo Video', price: '¥200,000〜', note: '30秒〜1分 / 企画提案込み' },
      { name: '編集・グレーディングのみ', price: '¥30,000〜', note: '素材支給の場合' },
    ],
  },
  {
    service: '写真撮影',
    items: [
      { name: 'ポートレート撮影', price: '¥40,000〜', note: '2時間 / データ納品' },
      { name: '商品・物撮り', price: '¥30,000〜', note: '10点まで / スタジオ手配込み' },
      { name: 'イベント・ライブ撮影', price: '要相談', note: 'スケジュール・規模により変動' },
    ],
  },
  {
    service: '音楽制作',
    items: [
      { name: '楽曲制作（フル）', price: '¥80,000〜', note: '3〜5分 / マスタリング込み' },
      { name: 'BGM / SE', price: '¥20,000〜', note: '1トラック / 用途に応じた尺' },
      { name: 'ミックス・マスタリングのみ', price: '¥15,000〜', note: 'トラック数により変動' },
    ],
  },
  {
    service: 'Web制作 / システム開発',
    items: [
      { name: 'コーポレートサイト', price: '¥200,000〜', note: '5〜10ページ / CMS込み' },
      { name: 'LP（ランディングページ）', price: '¥80,000〜', note: '1ページ / アニメーション込み' },
      { name: 'Webアプリ・カスタム開発', price: '要相談', note: '要件定義後に見積もり' },
      { name: '保守・改修', price: '¥15,000〜', note: '/ 月' },
    ],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: 'easeOut', delay: i * 0.07 },
  }),
}

export default function PricingPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('nav.pricing')} description={t('seo.pricing')} />

      {/* — header — */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          pricing
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl">
          {t('pricing.title')}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t('pricing.note')}
        </p>
      </motion.div>

      {/* — plans — */}
      <div className="mt-16 space-y-14">
        {PLANS.map((plan, pi) => (
          <motion.section
            key={plan.service}
            custom={pi}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-700 select-none">
                {String(pi + 1).padStart(2, '0')}
              </span>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {plan.service}
              </h2>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {plan.items.map((item, ii) => (
                <motion.div
                  key={item.name}
                  custom={ii * 0.5}
                  variants={fadeUp}
                  className="flex items-start justify-between gap-6 py-4"
                >
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{item.name}</p>
                    {item.note && (
                      <p className="mt-0.5 font-mono text-[11px] text-gray-400 dark:text-gray-600">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.price}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* — note — */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mt-16 border border-dashed border-gray-200 dark:border-gray-800 p-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
          // notice
        </p>
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-mono text-gray-300 dark:text-gray-700">—</span>
            上記はあくまで目安です。実際の費用は要件・規模・納期により異なります。
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-mono text-gray-300 dark:text-gray-700">—</span>
            初回のご相談・お見積りは無料です。
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-mono text-gray-300 dark:text-gray-700">—</span>
            複数カテゴリを組み合わせるパッケージプランも対応可能です。
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-mono text-gray-300 dark:text-gray-700">—</span>
            消費税は別途申し受けます。
          </li>
        </ul>
      </motion.div>

      {/* — CTA — */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mt-16 flex flex-col items-start gap-4 md:flex-row md:items-center"
      >
        <div>
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
            {t('pricing.cta')}
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">{t('pricing.ctaSub')}</p>
        </div>
        <div className="flex flex-wrap gap-3 md:ml-auto">
          <Link
            to={ROUTES.CONTACT}
            className="group inline-flex items-center gap-2 bg-gray-900 dark:bg-white px-7 py-3 text-sm font-medium tracking-wide text-white dark:text-gray-900 transition-all hover:bg-gray-700 dark:hover:bg-gray-100"
          >
            お問い合わせ・相談
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            to={ROUTES.ABOUT}
            className="inline-flex items-center border border-gray-200 dark:border-gray-700 px-7 py-3 text-sm font-medium tracking-wide text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500"
          >
            About
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
