import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import ContactForm from '@/modules/contact/components/ContactForm'
import RequestForm from '@/modules/contact/components/RequestForm'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'
import { Link, useSearchParams } from 'react-router-dom'
import { SplitWords } from '@/components/common/KineticText'

type Tab = 'contact' | 'request'

const TAB_META = {
  contact: { num: '01', icon: '✉', desc: 'お仕事・コラボ・その他のご連絡' },
  request: { num: '02', icon: '◈', desc: 'プロジェクト見積もり・RFP' },
} as const

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
    <section className="relative mx-auto max-w-2xl px-4 py-20 overflow-hidden">
      <PageHead title={t('nav.contact')} description={t('seo.contact')} />

      {/* subtle bg grid */}
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-20" />

      {/* corner marks */}
      <div className="pointer-events-none absolute right-4 top-8 h-8 w-8 border-r border-t border-cyan-500/15" />
      <div className="pointer-events-none absolute bottom-8 left-4 h-8 w-8 border-b border-l border-cyan-500/15" />

      <div className="relative">
        {/* page header */}
        <motion.p
          className="section-eyebrow mb-5"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          contact
        </motion.p>

        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
          <SplitWords text={t('nav.contact')} staggerMs={55} />
        </h1>

        <motion.p
          className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-[rgba(180,190,220,0.6)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          お仕事・コラボ・その他のご連絡はこちらから。
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Link
            to={ROUTES.PRICING}
            className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cyan-500/50 transition-colors hover:text-cyan-400"
          >
            料金の目安はこちら →
          </Link>
        </motion.div>

        {/* tab selector */}
        <motion.div
          className="mt-8 grid grid-cols-2 gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
        >
          {(['contact', 'request'] as Tab[]).map((tab) => {
            const meta = TAB_META[tab]
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => onTabClick(tab)}
                className="group relative overflow-hidden p-4 text-left transition-all duration-300"
                style={{
                  border: isActive ? '1px solid rgba(6,182,212,0.35)' : '1px solid rgba(6,182,212,0.1)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, transparent 65%)'
                    : 'transparent',
                }}
              >
                {/* active glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top left, rgba(6,182,212,0.06) 0%, transparent 70%)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                <span
                  className="absolute right-3 top-2.5 font-mono text-[9px] tracking-widest"
                  style={{ color: isActive ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.15)' }}
                >
                  {meta.num}
                </span>

                <span
                  className="mb-2 block font-mono text-sm"
                  style={{ color: isActive ? 'rgba(6,182,212,0.8)' : 'rgba(6,182,212,0.25)' }}
                >
                  {meta.icon}
                </span>
                <p
                  className="text-xs font-medium transition-colors"
                  style={{ color: isActive ? 'rgb(229,231,235)' : 'rgb(107,114,128)' }}
                >
                  {tab === 'contact' ? t('contact.tabContact') : t('contact.tabRequest')}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: isActive ? 'rgba(180,190,220,0.55)' : 'rgba(107,114,128,0.7)' }}>
                  {meta.desc}
                </p>

                {/* bottom active line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px transition-all duration-300"
                  style={{
                    background: isActive ? 'linear-gradient(to right, rgba(6,182,212,0.6), transparent)' : 'transparent',
                  }}
                />
              </button>
            )
          })}
        </motion.div>

        {/* form panel */}
        <motion.div
          className="mt-3 glass-cyber overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* window chrome */}
          <div className="flex items-center gap-1.5 border-b border-[rgba(6,182,212,0.1)] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-red-400/50" />
            <span className="h-2 w-2 rounded-full bg-amber-400/50" />
            <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
            <span className="ml-3 font-mono text-[9px] uppercase tracking-widest text-cyan-500/30">
              mizzz / {activeTab === 'contact' ? 'contact.sh' : 'request.sh'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <span className="font-mono text-[8px] text-cyan-500/20">●</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-500/20">
                {TAB_META[activeTab].num}
              </span>
            </div>
          </div>

          {/* form body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="px-6 py-8"
            >
              {activeTab === 'contact' ? <ContactForm /> : <RequestForm />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* bottom note */}
        <motion.p
          className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(6,182,212,0.25)] text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          // encrypted_transmission · 24h_response_sla
        </motion.p>
      </div>
    </section>
  )
}
