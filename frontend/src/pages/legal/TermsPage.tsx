import PageHead from '@/components/seo/PageHead'
import LegalDocumentMeta from '@/components/legal/LegalDocumentMeta'

const UPDATED_AT = '2026-04-05'

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="利用規約" description="mizzz の利用規約" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">利用規約</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">本規約は、本サイトの閲覧、問い合わせ、依頼、商品購入その他一切の利用条件を定めるものです。</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">第1章 適用範囲</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>本規約は、ユーザーと運営者との間の本サービス利用に関する一切の関係に適用されます。</li>
          <li>個別ページや商品説明に追加条件がある場合、当該条件は本規約の一部を構成します。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">第2章 禁止事項</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>コンテンツの無断転載、再配布、改変、公衆送信。</li>
          <li>不正アクセス、脆弱性探索、過剰リクエスト、システム運営妨害。</li>
          <li>第三者の権利侵害、虚偽情報の送信、法令違反または公序良俗違反行為。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">第3章 免責</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>運営者は、本サービスの完全性、正確性、継続性を保証しません。</li>
          <li>外部サービス（決済、認証、フォーム等）の障害に起因する損害について、運営者の故意・重過失を除き責任を負いません。</li>
          <li>ユーザー間または第三者との紛争は、当事者間で解決するものとします。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">第4章 準拠法・裁判管轄</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          本規約の解釈には日本法を準拠法とし、本サービスに関して紛争が生じた場合は、運営者所在地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>

      <LegalDocumentMeta
        updatedAt={UPDATED_AT}
        revisions={[
          { date: '2026-04-05', note: '章立て構成へ再編し、禁止事項・免責・準拠法条項を追加' },
          { date: '2025-11-12', note: '初版公開' },
        ]}
      />
    </section>
  )
}
