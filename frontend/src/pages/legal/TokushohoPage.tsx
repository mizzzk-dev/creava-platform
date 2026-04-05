import PageHead from '@/components/seo/PageHead'
import LegalDocumentMeta from '@/components/legal/LegalDocumentMeta'

const UPDATED_AT = '2026-04-05'

export default function TokushohoPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="特定商取引法に基づく表記" description="mizzz Store の法定表記" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">特定商取引法に基づく表記</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">本ページは、特定商取引法に基づく表示事項を定めるものです。</p>

      <dl className="space-y-3 text-sm">
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">販売業者</dt>
          <dd className="text-gray-600 dark:text-gray-400">mizzz（個人事業）</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">運営責任者</dt>
          <dd className="text-gray-600 dark:text-gray-400">運営責任者名は請求があれば遅滞なく開示します。</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">所在地</dt>
          <dd className="text-gray-600 dark:text-gray-400">所在地は請求があれば遅滞なく開示します。</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">連絡先</dt>
          <dd className="text-gray-600 dark:text-gray-400">お問い合わせフォームよりご連絡ください（平日3営業日以内目安）。</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">販売価格</dt>
          <dd className="text-gray-600 dark:text-gray-400">各商品ページに税込表示します。</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">商品代金以外の必要料金</dt>
          <dd className="text-gray-600 dark:text-gray-400">決済手数料、通信費、配送がある場合の送料（該当時に表示）。</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">支払時期・方法</dt>
          <dd className="text-gray-600 dark:text-gray-400">Stripe / BASE 等の外部決済ページに表示される方法・時期に従います。</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">引渡時期</dt>
          <dd className="text-gray-600 dark:text-gray-400">決済完了後、商品ページに定める時期・方法で提供します。</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-gray-900 dark:text-gray-100">返品・キャンセル特約</dt>
          <dd className="text-gray-600 dark:text-gray-400">
            デジタル商品・役務の性質上、提供後の返品・返金は原則不可です。瑕疵がある場合は個別に対応します。
          </dd>
        </div>
      </dl>

      <LegalDocumentMeta
        updatedAt={UPDATED_AT}
        revisions={[
          { date: '2026-04-05', note: '法定必須項目（追加手数料・支払時期・返品特約等）を追加' },
          { date: '2025-11-12', note: '初版公開' },
        ]}
      />
    </section>
  )
}
