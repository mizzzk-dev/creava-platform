import PageHead from '@/components/seo/PageHead'

const UPDATED_AT = '2026-04-05'

export default function TokushohoPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="特定商取引法に基づく表記" description="mizzz Store の法定表記" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">特定商取引法に基づく表記</h1>
      <p className="text-xs text-gray-400 dark:text-gray-600">最終更新日: {UPDATED_AT}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">販売条件や決済方法の詳細は、各商品詳細ページおよび外部決済ページの表示を優先します。</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
        <li>販売価格: 各商品ページに税込価格を表示。</li>
        <li>支払方法: Stripe / BASE 等、商品ページに記載の方法。</li>
        <li>引渡時期: 決済完了後、商品ページ記載の条件に従って提供。</li>
        <li>返品・交換: 商品特性により対応可否が異なります。詳細は商品説明を確認してください。</li>
      </ul>
    </section>
  )
}
