import PageHead from '@/components/seo/PageHead'

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 space-y-6">
      <PageHead title="利用規約" description="mizzz の利用規約" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">利用規約</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">本サイトの利用条件、禁止事項、免責事項を定めます。実運用に合わせて編集してください。</p>
    </section>
  )
}
