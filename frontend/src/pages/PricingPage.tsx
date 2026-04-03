import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import { ROUTES } from '@/lib/routeConstants'
import { SITE_URL } from '@/lib/seo'

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

const PROCESS_STEPS = [
  { step: '01', label: 'お問い合わせ', desc: 'フォームまたはメールでご連絡ください。' },
  { step: '02', label: 'ヒアリング', desc: '目的・規模・スケジュールを確認します。' },
  { step: '03', label: 'お見積もり', desc: '要件をもとに費用・納期をご提案します。' },
  { step: '04', label: 'ご発注・着手', desc: '合意後、制作を開始します。' },
  { step: '05', label: '納品・修正', desc: '成果物の確認・修正を経て納品します。' },
]

const USE_CASES = [
  { icon: '◈', text: 'SNS・プロモーション用のMVやショートフィルムを作りたい' },
  { icon: '◉', text: 'ブランドイメージに合う写真素材を一括で制作したい' },
  { icon: '◎', text: '映像や商業施設向けのオリジナルBGMが必要' },
  { icon: '◇', text: 'ポートフォリオや作品紹介サイトをゼロから構築したい' },
  { icon: '◈', text: '映像・写真・音楽をまとめてブランディングに活用したい' },
  { icon: '◉', text: 'イベント・ライブの撮影と映像編集を一括依頼したい' },
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
      <StructuredData
        schema={{
          type: 'BreadcrumbList',
          items: [
            { name: 'Home', url: SITE_URL },
            { name: t('nav.pricing'), url: `${SITE_URL}${ROUTES.PRICING}` },
          ],
        }}
      />

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

      {/* — use cases — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mt-16 border border-dashed border-gray-200 dark:border-gray-800 p-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-5">
          // こんな方に向いています
        </p>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {USE_CASES.map((uc, i) => (
            <motion.li
              key={i}
              custom={i * 0.4}
              variants={fadeUp}
              className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400"
            >
              <span className="shrink-0 font-mono text-gray-300 dark:text-gray-700 mt-0.5 select-none">
                {uc.icon}
              </span>
              {uc.text}
            </motion.li>
          ))}
        </ul>
      </motion.section>

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

      {/* — process flow — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mt-20"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-8">
          // 依頼の流れ
        </p>
        <div className="relative">
          {/* connector line (desktop) */}
          <div className="absolute top-5 left-[2.75rem] right-[2.75rem] h-px bg-gray-100 dark:bg-gray-800 hidden md:block" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            {PROCESS_STEPS.map(({ step, label, desc }, i) => (
              <motion.div
                key={step}
                custom={i * 0.3}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 font-mono text-[11px] text-gray-400 dark:text-gray-600">
                  {step}
                </div>
                <p className="mt-3 text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-gray-400 dark:text-gray-600">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

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

        {/* FAQ link */}
        <div className="mt-5 border-t border-dashed border-gray-100 dark:border-gray-900 pt-4">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            料金や契約に関するよくある質問は{' '}
            <Link
              to={ROUTES.FAQ}
              className="text-gray-600 dark:text-gray-400 underline underline-offset-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              FAQ
            </Link>{' '}
            もご参照ください。
          </p>
        </div>
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
            to={ROUTES.FAQ}
            className="inline-flex items-center border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400 transition-all hover:border-gray-400 dark:hover:border-gray-500"
          >
            FAQ
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
