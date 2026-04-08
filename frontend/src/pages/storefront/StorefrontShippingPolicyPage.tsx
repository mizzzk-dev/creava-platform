import PageHead from '@/components/seo/PageHead'
import { MAIN_SITE_URL } from '@/lib/siteLinks'

export default function StorefrontShippingPolicyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <PageHead title="配送ポリシー | mizzz Official Store" description="mizzz Official Store の配送ポリシー。" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">配送ポリシー</h1>
      <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600 dark:text-gray-300">
        <li>通常商品はご注文確定後 5〜8 営業日で発送します。</li>
        <li>予約商品・受注生産品は商品ページ記載の日程を優先します。</li>
        <li>配送先は日本国内（JST基準）を標準とし、海外配送は段階的に対応予定です。</li>
      </ul>
      <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
        お問い合わせは <a href={`${MAIN_SITE_URL}/contact`} className="underline-offset-2 hover:underline">mizzz.jp お問い合わせページ</a> から受け付けています。
      </p>
    </section>
  )
}
