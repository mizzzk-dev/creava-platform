import PageHead from '@/components/seo/PageHead'
import LegalDocumentMeta from '@/components/legal/LegalDocumentMeta'

const UPDATED_AT = '2026-04-05'

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="プライバシーポリシー" description="mizzz の個人情報保護方針" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">プライバシーポリシー</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">本ポリシーは、個人情報の保護に関する法律（日本法）を踏まえ、取得情報の取扱いを定めるものです。</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1. 取得する情報と利用目的</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>取得項目: 氏名、連絡先、依頼内容、アクセスログ、購入関連情報。</li>
          <li>利用目的: 問い合わせ対応、制作依頼対応、本人確認、サービス改善、不正利用防止。</li>
          <li>法令に基づく対応または権利保護のため必要な場合に限り、必要最小限で利用します。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2. 保管期間</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          取得情報は、利用目的の達成に必要な期間または法令で定める保存期間に限って保管し、期間満了後は適切に削除または匿名化します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">3. 安全管理措置</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>アクセス制御、権限管理、通信の暗号化、ログ監査など技術的・組織的措置を講じます。</li>
          <li>委託先を利用する場合は、契約により適切な監督を行います。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">4. 開示・訂正・利用停止等の請求</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          本人からの開示、訂正、追加、削除、利用停止、第三者提供停止等の請求は、本人確認を行った上で、法令に従い合理的な範囲で対応します。
        </p>
      </section>

      <LegalDocumentMeta
        updatedAt={UPDATED_AT}
        revisions={[
          { date: '2026-04-05', note: '利用目的・保管期間・安全管理措置・開示請求手続きを明確化' },
          { date: '2025-11-12', note: '初版公開' },
        ]}
      />
    </section>
  )
}
