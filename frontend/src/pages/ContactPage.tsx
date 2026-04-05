import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import ContactForm from '@/modules/contact/components/ContactForm'
import RequestForm from '@/modules/contact/components/RequestForm'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'
import { Link, useSearchParams } from 'react-router-dom'

type Tab = 'contact' | 'request'

export default function ContactPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<Tab>(() => (
    searchParams.get('tab') === 'request' ? 'request' : 'contact'
  ), [searchParams])
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const onTabClick = (tab: Tab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'request' ? { tab: 'request' } : {})
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-20">
      <PageHead title={t('nav.contact')} description={t('seo.contact')} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* page header */}
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          contact
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {t('nav.contact')}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          お仕事・コラボ・その他のご連絡はこちらから。<br />
          <Link to={ROUTES.PRICING} className="text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 underline underline-offset-2 text-xs">
            料金の目安はこちら →
          </Link>
        </p>

        {/* terminal container */}
        <div className="mt-8 rounded-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* window chrome */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="ml-3 font-mono text-[10px] text-gray-400 dark:text-gray-600">
              mizzz / contact.sh
            </span>
          </div>

          {/* tab bar */}
          <div className="flex bg-gray-950 border-b border-gray-800">
            {(['contact', 'request'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabClick(tab)}
                className={`px-5 py-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                  activeTab === tab
                    ? 'text-emerald-400 border-b-2 border-emerald-600 bg-gray-900'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {tab === 'contact' ? t('contact.tabContact') : t('contact.tabRequest')}
              </button>
            ))}
          </div>

          {/* form body */}
          <div className="bg-gray-950 px-6 py-8">
            {activeTab === 'contact' ? <ContactForm /> : <RequestForm />}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
