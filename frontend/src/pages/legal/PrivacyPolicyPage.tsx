import PageHead from '@/components/seo/PageHead'

const UPDATED_AT = '2026-04-05'

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="プライバシーポリシー" description="mizzz の個人情報保護方針" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">プライバシーポリシー</h1>
      <p className="text-xs text-gray-400 dark:text-gray-600">最終更新日: {UPDATED_AT}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">お問い合わせや依頼フォームで取得した個人情報は、返信・業務連絡・サービス改善の目的で利用します。</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
        <li>取得項目: 氏名、連絡先、依頼内容など入力情報。</li>
        <li>利用目的: お問い合わせ対応、依頼対応、運用上の連絡。</li>
        <li>第三者提供: 法令に基づく場合を除き、本人同意なく提供しません。</li>
      </ul>
    </section>
  )
}
