import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/routeConstants'
import { SplitWords } from '@/components/common/KineticText'

const SERVICES = [
  { icon: '▶', label: '映像制作',  from: '¥150,000〜', accent: 'cyan',   num: '01' },
  { icon: '◉', label: '写真撮影',  from: '¥30,000〜',  accent: 'amber',  num: '02' },
  { icon: '♩', label: '音楽制作',  from: '¥15,000〜',  accent: 'violet', num: '03' },
  { icon: '◈', label: 'Web / Dev', from: '¥80,000〜',  accent: 'cyan',   num: '04' },
]

const accentCfg = {
  cyan:   { border: 'rgba(6,182,212,0.2)',   text: '#06b6d4', glow: 'rgba(6,182,212,0.06)'   },
  amber:  { border: 'rgba(245,158,11,0.2)',  text: '#f59e0b', glow: 'rgba(245,158,11,0.06)'  },
  violet: { border: 'rgba(139,92,246,0.2)',  text: '#8b5cf6', glow: 'rgba(139,92,246,0.06)'  },
}

export default function PricingTeaserSection() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden border-t border-[rgba(6,182,212,0.08)]">
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative mx-auto max-w-5xl px-4 py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">

          {/* Left: text + CTA */}
          <div className="max-w-sm">
            <motion.p
              className="section-eyebrow mb-5"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              {t('home.pricing.subtitle')}
            </motion.p>

            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
              <SplitWords text={t('home.pricing.title')} staggerMs={55} />
            </h2>

            <motion.p
              className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-[rgba(180,190,220,0.65)]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              {t('home.pricing.body')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.45 }}
            >
              <Link to={ROUTES.PRICING} className="btn-cyber-outline group mt-7 inline-flex items-center gap-2">
                {t('home.pricing.cta')}
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Right: 2×2 service cards */}
          <div className="grid grid-cols-2 gap-3 md:w-[380px]">
            {SERVICES.map(({ icon, label, from, accent, num }, i) => {
              const cfg = accentCfg[accent as keyof typeof accentCfg]
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                  className="group relative p-5 transition-all duration-300 cursor-default overflow-hidden"
                  style={{
                    border: `1px solid ${cfg.border}`,
                    background: `linear-gradient(135deg, ${cfg.glow} 0%, transparent 65%)`,
                  }}
                >
                  {/* Corner number */}
                  <span
                    className="absolute right-3 top-2.5 font-mono text-[9px] tracking-widest"
                    style={{ color: cfg.text, opacity: 0.25 }}
                  >
                    {num}
                  </span>

                  <span className="mb-3 block font-mono text-sm opacity-60" style={{ color: cfg.text }}>
                    {icon}
                  </span>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
                  <p className="mt-1.5 font-mono text-xs" style={{ color: cfg.text }}>{from}</p>

                  {/* Hover underline */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ background: cfg.text, opacity: 0.35 }}
                  />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
