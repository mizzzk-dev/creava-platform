import { Link } from 'react-router-dom'
import PageHead from '@/components/seo/PageHead'
import { MAIN_SITE_URL } from '@/lib/siteLinks'

const LEGAL_LINKS = [
  {
    to: '/terms',
    title: '利用規約',
    description: 'ストア利用時のルールと禁止事項を確認できます。',
  },
  {
    to: '/privacy',
    title: 'プライバシーポリシー',
    description: '個人情報の取り扱いと管理方針を掲載しています。',
  },
  {
    to: '/legal/tokushoho',
    title: '特定商取引法に基づく表記',
    description: '販売事業者情報、価格、支払方法、返品条件を掲載しています。',
  },
]

export default function StorefrontLegalPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <PageHead title="Legal | mizzz Official Store" description="mizzz Official Store の法務情報一覧" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Legal</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">公開前チェックや購入前確認に必要な法務情報をまとめています。</p>

      <div className="mt-8 grid gap-3">
        {LEGAL_LINKS.map((item) => (
          <Link key={item.to} to={item.to} className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-600">
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
          </Link>
        ))}
      </div>
      <a href={`${MAIN_SITE_URL}/contact`} className="mt-5 inline-flex text-sm text-gray-600 underline-offset-2 hover:underline dark:text-gray-300">
        ストアに関するお問い合わせは mizzz.jp のお問い合わせページをご利用ください
      </a>
    </section>
  )
}
