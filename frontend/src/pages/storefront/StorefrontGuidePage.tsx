import { Link } from 'react-router-dom'
import PageHead from '@/components/seo/PageHead'
import { MAIN_SITE_URL } from '@/lib/siteLinks'

const GUIDE_LINKS = [
  { to: '/shipping-policy', label: '配送ポリシー' },
  { to: '/returns', label: '返品・交換ポリシー' },
  { to: '/terms', label: '利用規約' },
  { to: '/privacy', label: 'プライバシーポリシー' },
  { to: '/legal/tokushoho', label: '特定商取引法表記' },
] as const

export default function StorefrontGuidePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <PageHead title="Guide | mizzz Official Store" description="配送・返品・お問い合わせ・規約情報への導線ページ。" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Guide</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">ご購入前に確認いただきたい情報をまとめています。</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {GUIDE_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-600">
            {link.label}
          </Link>
        ))}
        <a href={`${MAIN_SITE_URL}/contact`} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-600">
          お問い合わせ（mizzz.jp）
        </a>
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">ストアに関するお問い合わせは mizzz.jp のお問い合わせページから受け付けています。</p>
    </section>
  )
}
