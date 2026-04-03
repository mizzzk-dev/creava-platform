import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import PageHead from '@/components/seo/PageHead'
import { ROUTES } from '@/lib/routeConstants'

const SKILLS = [
  { label: 'Video', items: ['MV / CM / Short Film', 'Documentary', 'Editing / Color Grading'] },
  { label: 'Photo', items: ['Portrait / Lifestyle', 'Product / Commercial', 'Event / Live'] },
  { label: 'Music', items: ['Composition / Arrangement', 'Recording / Mixing', 'Sound Design'] },
]

const SERVICES = [
  { icon: '◈', title: '映像制作', desc: 'MV・CM・短編映画・ドキュメンタリー。企画から撮影・編集まで一貫して対応します。' },
  { icon: '◉', title: '写真撮影', desc: 'ポートレート・商品・イベント。ブランドイメージに合わせたビジュアルを提供します。' },
  { icon: '◎', title: '音楽制作', desc: '楽曲制作・編曲・MIX。映像や空間に合わせたオリジナルサウンドを制作します。' },
  { icon: '◇', title: 'ブランディング支援', desc: 'ビジュアルアイデンティティの設計から世界観の一貫した表現まで。' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.08 },
  }),
}

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('nav.about')} description={t('seo.about')} />

      {/* — hero — */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="border-b border-gray-100 dark:border-gray-800 pb-16"
      >
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          about
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl">
          {t('about.headline')}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500 dark:text-gray-400">
          {t('about.subHeadline')}
        </p>

        {/* genre tags */}
        <div className="mt-6 flex flex-wrap gap-2">
          {['film', 'photo', 'music'].map((g) => (
            <span
              key={g}
              className="rounded-sm border border-gray-200 dark:border-gray-700 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600"
            >
              {g}
            </span>
          ))}
        </div>
      </motion.div>

      {/* — bio — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 border-b border-gray-100 dark:border-gray-800"
      >
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          {/* profile image placeholder */}
          <div className="aspect-square w-full max-w-[260px] overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="dot-grid flex h-full w-full items-center justify-center opacity-30">
              <span className="font-mono text-[11px] text-gray-400 dark:text-gray-600">photo</span>
            </div>
          </div>

          {/* bio text */}
          <div className="flex flex-col justify-center gap-5">
            <p className="text-base leading-loose text-gray-600 dark:text-gray-400">
              {t('about.bio1')}
            </p>
            <p className="text-base leading-loose text-gray-600 dark:text-gray-400">
              {t('about.bio2')}
            </p>

            {/* approach */}
            <blockquote className="border-l-2 border-violet-300 dark:border-violet-700 pl-4">
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 italic">
                {t('about.approachText')}
              </p>
            </blockquote>
          </div>
        </div>
      </motion.section>

      {/* — skills — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 border-b border-gray-100 dark:border-gray-800"
      >
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          {t('about.skills')}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.label}
              custom={i}
              variants={fadeUp}
              className="space-y-3 border border-gray-100 dark:border-gray-800 p-5"
            >
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
                {skill.label}
              </h3>
              <ul className="space-y-1.5">
                {skill.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="mt-1 font-mono text-[9px] text-gray-300 dark:text-gray-700 select-none">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* — services — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 border-b border-gray-100 dark:border-gray-800"
      >
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
          {t('about.services')}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.title}
              custom={i}
              variants={fadeUp}
              className="flex gap-4 p-5 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              <span className="shrink-0 font-mono text-lg text-gray-200 dark:text-gray-700 select-none mt-0.5">
                {svc.icon}
              </span>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{svc.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{svc.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* — CTA — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6"
      >
        <Link
          to={ROUTES.CONTACT}
          className="group inline-flex items-center gap-2 bg-gray-900 dark:bg-white px-7 py-3 text-sm font-medium tracking-wide text-white dark:text-gray-900 transition-all hover:bg-gray-700 dark:hover:bg-gray-100"
        >
          {t('about.ctaContact')}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
        <Link
          to={ROUTES.PRICING}
          className="inline-flex items-center border border-gray-200 dark:border-gray-700 px-7 py-3 text-sm font-medium tracking-wide text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500"
        >
          {t('about.ctaPricing')}
        </Link>
        <Link
          to={ROUTES.WORKS}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {t('about.ctaWorks')} →
        </Link>
      </motion.section>
    </div>
  )
}
