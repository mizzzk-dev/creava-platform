import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import GitHubActivityCard from '@/components/common/GitHubActivityCard'
import { ROUTES } from '@/lib/routeConstants'
import { SITE_URL, SITE_NAME } from '@/lib/seo'

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

const PRICING_HIGHLIGHTS = [
  { label: '映像制作', from: '¥150,000〜' },
  { label: '写真撮影', from: '¥30,000〜' },
  { label: '音楽制作', from: '¥15,000〜' },
  { label: 'Web制作', from: '¥80,000〜' },
]

const SNS_SAME_AS: string[] = [
  import.meta.env.VITE_SNS_X_URL,
  import.meta.env.VITE_SNS_INSTAGRAM_URL,
  import.meta.env.VITE_SNS_NOTE_URL,
  import.meta.env.VITE_SNS_YOUTUBE_URL,
].filter(Boolean) as string[]

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
      <StructuredData
        schema={{
          type: 'Person',
          name: SITE_NAME,
          url: `${SITE_URL}${ROUTES.ABOUT}`,
          description: t('seo.about'),
          sameAs: SNS_SAME_AS,
        }}
      />
      <StructuredData
        schema={{
          type: 'BreadcrumbList',
          items: [
            { name: 'Home', url: SITE_URL },
            { name: t('nav.about'), url: `${SITE_URL}${ROUTES.ABOUT}` },
          ],
        }}
      />

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
          {/* left: profile image + GitHub card */}
          <div className="flex flex-col gap-4">
            {/* profile image placeholder */}
            <div className="aspect-square w-full max-w-[260px] overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className="dot-grid flex h-full w-full items-center justify-center opacity-30">
                <span className="font-mono text-[11px] text-gray-400 dark:text-gray-600">photo</span>
              </div>
            </div>

            {/* GitHub activity */}
            <div className="max-w-[260px]">
              <GitHubActivityCard />
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

      {/* — pricing teaser — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 border-b border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {t('about.ctaPricing')}
          </p>
          <Link
            to={ROUTES.PRICING}
            className="font-mono text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {t('pricing.title')} →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {PRICING_HIGHLIGHTS.map(({ label, from }) => (
            <div
              key={label}
              className="border border-gray-100 dark:border-gray-800 p-4 space-y-1"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">{from}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] text-gray-400 dark:text-gray-600">
          {t('pricing.note')}
        </p>
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
