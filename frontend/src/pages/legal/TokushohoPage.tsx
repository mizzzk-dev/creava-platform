import PageHead from '@/components/seo/PageHead'

export default function TokushohoPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="特定商取引法に基づく表記" description="mizzz Store の法定表記" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">特定商取引法に基づく表記</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">販売事業者、連絡先、支払方法、引渡時期、返品条件等を掲載します。</p>
    </section>
  )
}
