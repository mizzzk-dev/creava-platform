import PageHead from '@/components/seo/PageHead'
import LegalDocumentMeta from '@/components/legal/LegalDocumentMeta'

const UPDATED_AT = '2026-04-05'

export default function CookiePolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="Cookieポリシー" description="mizzz の Cookie 利用方針" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Cookieポリシー</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">本サイトは、表示や動作に必要な Cookie と、同意に基づく解析 Cookie を使用します。</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1. Cookie一覧と保持期間</h2>
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr className="text-gray-600 dark:text-gray-400">
                <th className="px-3 py-2">区分</th>
                <th className="px-3 py-2">主な用途</th>
                <th className="px-3 py-2">代表例</th>
                <th className="px-3 py-2">保持期間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-400">
              <tr>
                <td className="px-3 py-2">必須</td>
                <td className="px-3 py-2">言語・テーマ・同意状態の保持</td>
                <td className="px-3 py-2">site_lang, site_theme, cookie_consent</td>
                <td className="px-3 py-2">30日〜12か月</td>
              </tr>
              <tr>
                <td className="px-3 py-2">解析</td>
                <td className="px-3 py-2">利用状況の計測、改善指標の分析</td>
                <td className="px-3 py-2">analytics_consent, _ga 等</td>
                <td className="px-3 py-2">最長24か月</td>
              </tr>
              <tr>
                <td className="px-3 py-2">広告</td>
                <td className="px-3 py-2">広告配信・効果測定（導入時のみ）</td>
                <td className="px-3 py-2">ad_storage など</td>
                <td className="px-3 py-2">最長13か月</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2. 同意管理</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">同意バナーで解析 Cookie の可否を選択できます。後から Footer の「Cookie設定」より再設定できます。</p>
      </section>

      <LegalDocumentMeta
        updatedAt={UPDATED_AT}
        revisions={[
          { date: '2026-04-05', note: 'Cookie一覧に区分・代表例・保持期間を明記' },
          { date: '2025-11-12', note: '初版公開' },
        ]}
      />
    </section>
  )
}
