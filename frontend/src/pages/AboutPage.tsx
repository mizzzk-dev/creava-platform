import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { getBlogList } from '@/modules/blog/api'
import { getMediaUrl, formatDate } from '@/utils'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import GitHubActivityCard from '@/components/common/GitHubActivityCard'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import type { Work, BlogPost } from '@/types'

type AvailabilityStatus = 'available' | 'limited' | 'unavailable'
const AVAILABILITY = import.meta.env.VITE_AVAILABILITY_STATUS as AvailabilityStatus | undefined

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

const TOOLS = [
  {
    category: 'Film / Photo',
    items: ['DaVinci Resolve', 'Adobe Premiere', 'Lightroom', 'Capture One'],
  },
  {
    category: 'Music',
    items: ['Logic Pro', 'Ableton Live', 'Pro Tools'],
  },
  {
    category: 'Web / Dev',
    items: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Strapi', 'Clerk', 'Stripe'],
  },
]

// Social proof — メディア掲載・受賞歴
const SOCIAL_PROOF = [
  { label: 'Forbes Japan 30 Under 30', year: '2023', category: 'Creator' },
  { label: 'Photography Award', year: '2023', category: 'Best Portrait' },
  { label: 'Creative Monthly', year: '2024', category: 'Feature' },
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

const AVAILABILITY_CONFIG: Record<
  AvailabilityStatus,
  { dot: string; label: string; key: string }
> = {
  available:   { dot: 'bg-emerald-400', label: 'text-emerald-600 dark:text-emerald-500', key: 'about.availableText' },
  limited:     { dot: 'bg-amber-400',   label: 'text-amber-600 dark:text-amber-500',     key: 'about.limitedText'    },
  unavailable: { dot: 'bg-red-400',     label: 'text-red-500 dark:text-red-500',         key: 'about.unavailableText' },
}

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
  const avail = AVAILABILITY ? AVAILABILITY_CONFIG[AVAILABILITY] : null

  // Case study — featured works
  const { items: works } = useStrapiCollection<Work>(() =>
    getWorksList({ pagination: { pageSize: 6 } }),
  )
  const featuredWorks = works
    ? works.filter((w) => w.isFeatured && w.accessStatus === 'public').slice(0, 3)
    : []

  // Featured writing — latest blog posts
  const { items: blogPosts } = useStrapiCollection<BlogPost>(() =>
    getBlogList({ pagination: { pageSize: 3 } }),
  )
  const featuredBlog = blogPosts
    ? blogPosts.filter((b) => b.accessStatus === 'public').slice(0, 2)
    : []

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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {['film', 'photo', 'music'].map((g) => (
            <span
              key={g}
              className="rounded-sm border border-gray-200 dark:border-gray-700 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600"
            >
              {g}
            </span>
          ))}

          {/* availability badge */}
          {avail && (
            <span className="flex items-center gap-1.5 rounded-sm border border-gray-100 dark:border-gray-800 px-2.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                {AVAILABILITY === 'available' && (
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${avail.dot} opacity-60`} />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${avail.dot}`} />
              </span>
              <span className={`font-mono text-[10px] tracking-wide ${avail.label}`}>
                {t('about.availability')}
              </span>
            </span>
          )}
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
            <div className="aspect-square w-full max-w-[260px] overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className="dot-grid flex h-full w-full items-center justify-center opacity-30">
                <span className="font-mono text-[11px] text-gray-400 dark:text-gray-600">photo</span>
              </div>
            </div>
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
            <blockquote className="border-l-2 border-violet-300 dark:border-violet-700 pl-4">
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 italic">
                {t('about.approachText')}
              </p>
            </blockquote>
          </div>
        </div>
      </motion.section>

      {/* — now — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 border-b border-gray-100 dark:border-gray-800"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600 whitespace-nowrap">
            {t('about.now')}
          </p>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {t('about.nowText')}
            </p>
            {avail && (
              <p className={`font-mono text-[11px] ${avail.label}`}>
                — {t(avail.key)}
              </p>
            )}
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
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-1 font-mono text-[9px] text-gray-300 dark:text-gray-700 select-none">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* — selected tools — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 border-b border-gray-100 dark:border-gray-800"
      >
        <div className="flex flex-col gap-1 mb-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {t('about.tools')}
          </p>
          <p className="font-mono text-[10px] text-gray-300 dark:text-gray-700">
            {t('about.toolsDesc')}
          </p>
        </div>

        <div className="space-y-6">
          {TOOLS.map((group, i) => (
            <motion.div
              key={group.category}
              custom={i}
              variants={fadeUp}
              className="grid grid-cols-[80px_1fr] gap-4 items-start md:grid-cols-[120px_1fr]"
            >
              <span className="font-mono text-[9px] uppercase tracking-widest text-gray-300 dark:text-gray-700 pt-0.5">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-2">
                {group.items.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-sm border border-gray-100 dark:border-gray-800 px-2.5 py-1 font-mono text-[11px] text-gray-500 dark:text-gray-400"
                  >
                    {tool}
                  </span>
                ))}
              </div>
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

      {/* — social proof — */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-16 border-b border-gray-100 dark:border-gray-800"
      >
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-8">
          {t('about.socialProof')}
        </p>
        <div className="space-y-3">
          {SOCIAL_PROOF.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 dark:border-gray-900 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-gray-300 dark:text-gray-700 select-none w-8">{item.year}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-700 shrink-0">
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* — case study / selected works — */}
      {featuredWorks.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="py-16 border-b border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
              {t('about.selectedWorks')}
            </p>
            <Link
              to={ROUTES.WORKS}
              className="font-mono text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('about.ctaWorks')} →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featuredWorks.map((work) => (
              <Link
                key={work.id}
                to={detailPath.work(work.slug)}
                className="group relative overflow-hidden bg-gray-100 dark:bg-gray-800"
                style={{ aspectRatio: '4/3' }}
              >
                {getMediaUrl(work.thumbnail, 'small') ? (
                  <img
                    src={getMediaUrl(work.thumbnail, 'small')!}
                    alt={work.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="dot-grid flex h-full w-full items-center justify-center opacity-30">
                    <span className="font-mono text-[10px] text-gray-400">{work.category}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {work.category && (
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-white/60 mb-0.5">
                      {work.category}
                    </span>
                  )}
                  <p className="text-sm font-medium text-white leading-tight line-clamp-2">{work.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* — featured writing — */}
      {featuredBlog.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="py-16 border-b border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
              {t('about.featuredWriting')}
            </p>
            <Link
              to={ROUTES.BLOG}
              className="font-mono text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('home.latest.viewAll')} →
            </Link>
          </div>
          <div className="space-y-0">
            {featuredBlog.map((post) => (
              <Link
                key={post.id}
                to={detailPath.blog(post.slug)}
                className="group flex items-start gap-5 py-5 border-b border-gray-50 dark:border-gray-900 last:border-0"
              >
                {post.publishAt && (
                  <time
                    dateTime={post.publishAt}
                    className="hidden sm:block shrink-0 w-20 text-right font-mono text-[11px] text-gray-300 dark:text-gray-700 pt-0.5"
                  >
                    {new Date(post.publishAt).toLocaleDateString('ja-JP', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                    })}
                  </time>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors line-clamp-2">
                    {post.title}
                  </p>
                  {post.publishAt && (
                    <p className="sm:hidden mt-1 font-mono text-[10px] text-gray-400 dark:text-gray-600">
                      {formatDate(post.publishAt)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-gray-200 dark:text-gray-800 group-hover:translate-x-0.5 group-hover:text-gray-400 dark:group-hover:text-gray-600 transition-all duration-150 pt-0.5">
                  →
                </span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

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
            <div key={label} className="border border-gray-100 dark:border-gray-800 p-4 space-y-1">
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
