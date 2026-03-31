import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import ContactForm from '@/modules/contact/components/ContactForm'
import RequestForm from '@/modules/contact/components/RequestForm'

type Tab = 'contact' | 'request'

export default function ContactPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('contact')

  return (
    <section className="mx-auto max-w-2xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xs uppercase tracking-widest text-gray-400">
          {t('nav.contact')}
        </h1>

        {/* Tab switcher */}
        <div className="mt-8 flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 pr-6 text-sm font-medium transition-colors ${
              activeTab === 'contact'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {t('contact.tabContact')}
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`pb-3 pr-6 text-sm font-medium transition-colors ${
              activeTab === 'request'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {t('contact.tabRequest')}
          </button>
        </div>

        <div className="mt-8">
          {activeTab === 'contact' ? <ContactForm /> : <RequestForm />}
        </div>
      </motion.div>
    </section>
  )
}
