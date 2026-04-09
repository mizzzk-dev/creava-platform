import { Link } from 'react-router-dom'
import PageHead from '@/components/seo/PageHead'

export default function CheckoutResultPage({
  title,
  description,
  backTo,
  backLabel,
}: {
  title: string
  description: string
  backTo: string
  backLabel: string
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <PageHead title={title} description={description} noindex />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/70">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        <p className="mt-3 text-xs text-gray-500">決済ステータスはWebhook同期後に反映されます。反映まで少し時間がかかる場合があります。</p>
        <Link to={backTo} className="mt-6 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500">{backLabel} →</Link>
      </div>
    </section>
  )
}
