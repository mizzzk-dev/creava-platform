import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import { ROUTES } from '@/lib/routeConstants'
import { SITE_URL } from '@/lib/seo'

type Category = 'request' | 'production' | 'pricing' | 'other'

interface FAQItem {
  id: string
  category: Category
  q: string
  a: string
}

const FAQ_ITEMS: FAQItem[] = [
  // 依頼について
  {
    id: 'r1',
    category: 'request',
    q: '依頼から納品までの流れを教えてください。',
    a: 'お問い合わせ → ヒアリング（オンライン/メール）→ お見積り → ご発注 → 制作 → 納品・修正対応 という流れが基本です。プロジェクトの規模によって異なりますが、まずはお気軽にご相談ください。',
  },
  {
    id: 'r2',
    category: 'request',
    q: '個人・小規模プロジェクトでも依頼できますか？',
    a: 'はい、個人の方や小規模プロジェクトのご依頼も歓迎しています。まずは予算や規模感をお聞かせいただければ、最適な提案をいたします。',
  },
  {
    id: 'r3',
    category: 'request',
    q: 'どのくらい前から相談すればいいですか？',
    a: '納期・撮影日から逆算して、最低でも2〜4週間前のご相談をお勧めします。スケジュールに余裕があるほど丁寧な提案が可能です。急ぎ案件もご相談ください。',
  },
  {
    id: 'r4',
    category: 'request',
    q: 'リモートでも対応できますか？',
    a: 'ロケーション撮影などを除き、打ち合わせ・ディレクション・納品はすべてリモートで対応可能です。全国・海外からのご依頼もお受けしています。',
  },
  // 制作について
  {
    id: 'p1',
    category: 'production',
    q: '修正は何回まで対応してもらえますか？',
    a: '基本は2回の修正を含んでいます（軽微な調整は回数にカウントしません）。大幅な変更や方向転換が生じた場合は、追加費用についてご相談させていただきます。',
  },
  {
    id: 'p2',
    category: 'production',
    q: '撮影した素材の著作権はどちらに帰属しますか？',
    a: '制作物の著作権はクリエイター（当方）に帰属しますが、ご依頼いただいた用途での使用権はお客様にお渡しします。二次利用・商用展開が必要な場合は事前にご相談ください。',
  },
  {
    id: 'p3',
    category: 'production',
    q: '映像・写真・音楽を組み合わせてまとめて依頼できますか？',
    a: 'はい、複数カテゴリを一括でご依頼いただくことで、世界観に一貫性を持たせた制作が可能です。パッケージ料金についてもご相談ください。',
  },
  {
    id: 'p4',
    category: 'production',
    q: '納品形式はどのようなものですか？',
    a: '映像はMP4（H.264/H.265）、写真はJPEG/RAW、音楽はWAV/MP3が標準です。CMSやプラットフォーム向けの特定フォーマットが必要な場合はご相談ください。',
  },
  // 料金・契約について
  {
    id: 'c1',
    category: 'pricing',
    q: 'お見積りは無料ですか？',
    a: 'はい、初回のヒアリングとお見積りは完全無料です。ご発注が確定した時点から費用が発生します。',
  },
  {
    id: 'c2',
    category: 'pricing',
    q: '支払い方法・タイミングはどうなりますか？',
    a: '銀行振込でのお支払いをお願いしています。通常は着手前に50%、納品後に残額50%をご入金いただく形式です。プロジェクト規模により分割対応も可能です。',
  },
  {
    id: 'c3',
    category: 'pricing',
    q: 'キャンセルした場合はどうなりますか？',
    a: '制作着手前のキャンセルは無料です。着手後のキャンセルは進捗に応じたキャンセル料が発生する場合があります。詳細は契約書にてご確認ください。',
  },
  {
    id: 'c4',
    category: 'pricing',
    q: '請求書や領収書は発行してもらえますか？',
    a: 'はい、請求書・領収書・見積書はすべて発行可能です。インボイス制度対応の適格請求書も発行できます。',
  },
  // その他
  {
    id: 'o1',
    category: 'other',
    q: 'ファンクラブに加入するとどんな特典がありますか？',
    a: '限定動画・写真・音源へのアクセス、新作の最速告知、イベントの優先案内・チケット先行販売などが主な特典です。詳細はファンクラブページをご覧ください。',
  },
  {
    id: 'o2',
    category: 'other',
    q: 'SNS で作品のシェアはできますか？',
    a: 'はい、クレジット表記（@アカウント名 または サイトURL）を入れていただいた上でのシェアは歓迎しています。商用利用や無断転載はご遠慮ください。',
  },
]

const CATEGORIES: { id: Category; icon: string }[] = [
  { id: 'request', icon: '◈' },
  { id: 'production', icon: '◉' },
  { id: 'pricing', icon: '◎' },
  { id: 'other', icon: '◇' },
]

const bubble = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut', delay: i * 0.06 },
  }),
}

function FAQBubbles({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <motion.div key={item.id} custom={i} variants={bubble} className="space-y-2">
          {/* Q bubble — visitor style */}
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="group flex w-full items-start gap-3 text-left"
          >
            <span className="mt-0.5 shrink-0 font-mono text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-600 select-none pt-1">
              Q
            </span>
            <div className="flex-1 rounded-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 transition-colors group-hover:border-gray-300 dark:group-hover:border-gray-700">
              {item.q}
            </div>
            <span className="mt-2.5 shrink-0 font-mono text-[11px] text-gray-300 dark:text-gray-700 select-none transition-transform duration-200"
              style={{ transform: openId === item.id ? 'rotate(90deg)' : 'none' }}
            >
              ›
            </span>
          </button>

          {/* A bubble — creator style */}
          <AnimatePresence>
            {openId === item.id && (
              <motion.div
                key="answer"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-3 pl-6">
                  <span className="mt-0.5 shrink-0 font-mono text-[9px] uppercase tracking-widest text-violet-400 dark:text-violet-600 select-none pt-1">
                    A
                  </span>
                  <div className="flex-1 rounded-sm border border-violet-100 dark:border-violet-900/50 bg-white dark:bg-gray-900 px-4 py-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {item.a}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

export default function FAQPage() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  const faqSchemaItems = FAQ_ITEMS.map((item) => ({
    question: item.q,
    answer: item.a,
  }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <PageHead title={t('faq.title')} description={t('seo.faq')} />
      <StructuredData schema={{ type: 'FAQPage', items: faqSchemaItems }} />
      <StructuredData
        schema={{
          type: 'BreadcrumbList',
          items: [
            { name: 'Home', url: SITE_URL },
            { name: t('faq.title'), url: `${SITE_URL}/faq` },
          ],
        }}
      />

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          {t('faq.subtitle')}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl">
          {t('faq.title')}
        </h1>
      </motion.div>

      {/* category filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-10 flex flex-wrap gap-2"
      >
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors ${
            activeCategory === 'all'
              ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
              : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600'
          }`}
        >
          ALL
        </button>
        {CATEGORIES.map(({ id, icon }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors ${
              activeCategory === id
                ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            {icon} {t(`faq.categories.${id}`)}
          </button>
        ))}
      </motion.div>

      {/* FAQ items grouped by category */}
      <div className="mt-12 space-y-14">
        {(activeCategory === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === activeCategory)).map(
          ({ id, icon }) => {
            const items = FAQ_ITEMS.filter((item) => item.category === id)
            if (items.length === 0) return null
            return (
              <motion.section
                key={id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-300 dark:text-gray-700 select-none">
                    {icon}
                  </span>
                  <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-600">
                    {t(`faq.categories.${id}`)}
                  </h2>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                </div>

                <FAQBubbles items={items} />
              </motion.section>
            )
          },
        )}
      </div>

      {/* contact prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-16 border-t border-gray-100 dark:border-gray-800 pt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-gray-400 dark:text-gray-600">
          {t('faq.contactPrompt')}
        </p>
        <Link
          to={ROUTES.CONTACT}
          className="group inline-flex items-center gap-2 border border-gray-200 dark:border-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-600"
        >
          {t('faq.contactLink')}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </motion.div>
    </div>
  )
}
