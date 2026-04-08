import PageHead from '@/components/seo/PageHead'
import { MAIN_SITE_URL } from '@/lib/siteLinks'

export default function StorefrontReturnsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <PageHead title="返品・交換ポリシー | mizzz Official Store" description="mizzz Official Store の返品・交換方針。" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">返品・交換ポリシー</h1>
      <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600 dark:text-gray-300">
        <li>お客様都合による返品・交換は原則お受けしていません。</li>
        <li>不良品・誤配送の場合は、商品到着後 7 日以内にお問い合わせください。</li>
        <li>デジタル商品は性質上、購入完了後の返品はできません。</li>
      </ul>
      <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
        お問い合わせは <a href={`${MAIN_SITE_URL}/contact`} className="underline-offset-2 hover:underline">mizzz.jp お問い合わせページ</a> から受け付けています。
      </p>
    </section>
  )
}
