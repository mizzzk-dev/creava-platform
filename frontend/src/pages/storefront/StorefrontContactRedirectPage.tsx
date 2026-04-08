import { useEffect } from 'react'
import { MAIN_SITE_URL } from '@/lib/siteLinks'
import PageHead from '@/components/seo/PageHead'

const MAIN_CONTACT_URL = `${MAIN_SITE_URL}/contact`

export default function StorefrontContactRedirectPage() {
  useEffect(() => {
    window.location.replace(MAIN_CONTACT_URL)
  }, [])

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <PageHead
        title="お問い合わせ | mizzz Official Store"
        description="ストアに関するお問い合わせはメインサイトで受け付けています。"
      />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">お問い合わせ</h1>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        ストアに関するお問い合わせは、mizzz.jp のお問い合わせページから受け付けています。
      </p>
      <a
        href={MAIN_CONTACT_URL}
        className="mt-6 inline-flex rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
      >
        mizzz.jp お問い合わせへ移動
      </a>
    </section>
  )
}
