import PageHead from '@/components/seo/PageHead'

const UPDATED_AT = '2026-04-05'

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="利用規約" description="mizzz の利用規約" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">利用規約</h1>
      <p className="text-xs text-gray-400 dark:text-gray-600">最終更新日: {UPDATED_AT}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">本サイトの閲覧・購入・問い合わせの利用条件を定めます。</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
        <li>コンテンツの無断転載・再配布は禁止します。</li>
        <li>購入商品・限定情報の権利侵害行為は禁止します。</li>
        <li>予告なく内容を変更する場合があります。</li>
      </ul>
    </section>
  )
}
