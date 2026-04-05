import PageHead from '@/components/seo/PageHead'

const UPDATED_AT = '2026-04-05'

export default function CookiePolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="Cookieポリシー" description="mizzz の Cookie 利用方針" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Cookieポリシー</h1>
      <p className="text-xs text-gray-400 dark:text-gray-600">最終更新日: {UPDATED_AT}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">本サイトは、表示や動作に必要な Cookie と、同意に基づく解析 Cookie を使用します。</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1. 利用するCookie</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>必須 Cookie: テーマ、言語、同意状態など、サイト動作に必要な情報。</li>
          <li>解析 Cookie: 同意時のみ、アクセス傾向を把握して改善に利用。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2. 同意管理</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">同意バナーで解析 Cookie の可否を選択できます。後から Footer の「Cookie設定」より再設定できます。</p>
      </section>
    </section>
  )
}
