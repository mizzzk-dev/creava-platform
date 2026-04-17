import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useStrapiCollection, useStrapiSingle } from '@/hooks'
import { getWorksList } from '@/modules/works/api'
import { getBlogList } from '@/modules/blog/api'
import { getSiteSettings } from '@/modules/settings/api'
import { getMediaUrl, formatDate } from '@/utils'
import PageHead from '@/components/seo/PageHead'
import StructuredData from '@/components/seo/StructuredData'
import GitHubActivityCard from '@/components/common/GitHubActivityCard'
import SectionReveal from '@/components/common/SectionReveal'
import ResponsiveImage from '@/components/common/ResponsiveImage'
import { ROUTES, detailPath } from '@/lib/routeConstants'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import type { Work, BlogPost } from '@/types'

type AvailabilityStatus = 'available' | 'limited' | 'unavailable'
const AVAILABILITY = import.meta.env.VITE_AVAILABILITY_STATUS as AvailabilityStatus | undefined

const SKILLS = [
  { label: 'Video',  items: ['MV / CM / Short Film', 'Documentary', 'Editing / Color Grading'] },
  { label: 'Photo',  items: ['Portrait / Lifestyle', 'Product / Commercial', 'Event / Live'] },
  { label: 'Music',  items: ['Composition / Arrangement', 'Recording / Mixing', 'Sound Design'] },
]

const SERVICES = [
  { icon: '◈', title: '映像制作',      desc: 'MV・CM・短編映画・ドキュメンタリー。企画から撮影・編集まで一貫して対応します。' },
  { icon: '◉', title: '写真撮影',      desc: 'ポートレート・商品・イベント。ブランドイメージに合わせたビジュアルを提供します。' },
  { icon: '◎', title: '音楽制作',      desc: '楽曲制作・編曲・MIX。映像や空間に合わせたオリジナルサウンドを制作します。' },
  { icon: '◇', title: 'ブランディング支援', desc: 'ビジュアルアイデンティティの設計から世界観の一貫した表現まで。' },
]

const TOOLS = [
  { category: 'Film / Photo', items: ['DaVinci Resolve', 'Adobe Premiere', 'Lightroom', 'Capture One'] },
  { category: 'Music',        items: ['Logic Pro', 'Ableton Live', 'Pro Tools'] },
  { category: 'Web / Dev',    items: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Strapi', 'Logto', 'Stripe'] },
]

const SOCIAL_PROOF = [
  { label: 'Forbes Japan 30 Under 30', year: '2023', category: 'Creator' },
  { label: 'Photography Award',         year: '2023', category: 'Best Portrait' },
  { label: 'Creative Monthly',          year: '2024', category: 'Feature' },
]

const PRICING_HIGHLIGHTS = [
  { label: '映像制作', from: '¥150,000〜' },
  { label: '写真撮影', from: '¥30,000〜' },
  { label: '音楽制作', from: '¥15,000〜' },
  { label: 'Web制作',  from: '¥80,000〜' },
]

/* ── Timeline milestones (仮定データ) ─────────────── */
const TIMELINE = [
  { year: '2016', title: 'クリエイティブ活動開始', desc: '映像・写真・音楽を軸にフリーランスとして活動を開始。' },
  { year: '2018', title: '初の受賞',              desc: '写真部門での受賞を機に商業撮影の依頼が急増。' },
  { year: '2020', title: 'ブランド設立',          desc: 'mizzz として活動を統合。映像・音楽・写真を横断するスタイルへ。' },
  { year: '2023', title: 'Forbes 30 Under 30',   desc: 'アジアのクリエイター部門に選出。国際的な活動も本格化。' },
  { year: '2025', title: '現在',                  desc: 'ファンクラブ・EC・コンテンツ配信を含む総合的なクリエイター体験を構築中。', active: true },
]

/* ── Values ────────────────────────────────────────── */
const VALUES = [
  { icon: '✦', title: 'Craft',    desc: '細部にこだわり、完成度を追い求めることを創造の起点とする。' },
  { icon: '◈', title: 'Story',    desc: '映像・写真・音楽の背後に、語るべき物語があると信じる。' },
  { icon: '◉', title: 'Emotion',  desc: '技術より先に、感情を動かすことを目指す。' },
  { icon: '◇', title: 'Original', desc: '既存の枠に収まらない、自分だけの表現を常に模索する。' },
]

const SNS_SAME_AS: string[] = [
  import.meta.env.VITE_SNS_X_URL,
  import.meta.env.VITE_SNS_INSTAGRAM_URL,
  import.meta.env.VITE_SNS_NOTE_URL,
  import.meta.env.VITE_SNS_YOUTUBE_URL,
].filter(Boolean) as string[]

const AVAILABILITY_CONFIG: Record<AvailabilityStatus, { dot: string; label: string; key: string }> = {
  available:   { dot: 'bg-emerald-400', label: 'text-emerald-600 dark:text-emerald-400', key: 'about.availableText'   },
  limited:     { dot: 'bg-amber-400',   label: 'text-amber-600 dark:text-amber-400',     key: 'about.limitedText'     },
  unavailable: { dot: 'bg-red-400',     label: 'text-red-500 dark:text-red-400',         key: 'about.unavailableText' },
}

/* ── Shared reveal animation ────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
  }),
}

export default function AboutPage() {
  const { t, i18n } = useTranslation()
  const prefersReduced = useReducedMotion()
  const avail = AVAILABILITY ? AVAILABILITY_CONFIG[AVAILABILITY] : null
  const { item: settings } = useStrapiSingle(() =>
    getSiteSettings({ locale: i18n.resolvedLanguage }),
  )
  const aboutVisualDesktop = getMediaUrl(settings?.aboutMainVisual ?? null, 'large')
  const aboutSubImages = (settings?.aboutSubVisuals ?? [])
    .map((m) => getMediaUrl(m, 'medium'))
    .filter((u): u is string => Boolean(u))

  const { items: works } = useStrapiCollection<Work>(() =>
    getWorksList({ pagination: { pageSize: 6 } }),
  )
  const featuredWorks = works
    ? works.filter((w) => w.isFeatured && w.accessStatus === 'public').slice(0, 3)
    : []

  const { items: blogPosts } = useStrapiCollection<BlogPost>(() =>
    getBlogList({ pagination: { pageSize: 3 } }),
  )
  const featuredBlog = blogPosts
    ? blogPosts.filter((b) => b.accessStatus === 'public').slice(0, 2)
    : []

  return (
    <div className="mx-auto max-w-5xl px-4">
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

      {/* ══════════════════════════════════════════════
          HERO BLOCK — 大きなタイポグラフィ + 装飾
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* 背景装飾 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <motion.div
            className="absolute -top-10 -right-10 h-[320px] w-[320px] rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }}
            animate={prefersReduced ? {} : { scale: [1, 1.06, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.07] to-transparent" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Section label */}
          <motion.div variants={fadeUp} className="mb-8">
            <span className="section-label">about · mizzz</span>
          </motion.div>

          {/* Headline — 2行エディトリアル表示 */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl font-black leading-[1.04] tracking-tight text-gray-900 dark:text-white/90 md:text-[72px]"
          >
            {t('about.headline')}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-white/45"
          >
            {t('about.subHeadline')}
          </motion.p>

          {/* Tags + availability */}
          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-2.5">
            {['film', 'photo', 'music'].map((g) => (
              <span
                key={g}
                className="rounded-md border border-gray-200 bg-white/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/35"
              >
                {g}
              </span>
            ))}

            {avail && (
              <span className="flex items-center gap-1.5 rounded-md border border-gray-100 dark:border-white/[0.07] px-3 py-1">
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
          </motion.div>

          {/* Stats bar — 実績アンカー */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap gap-8 border-t border-gray-100 dark:border-white/[0.06] pt-8"
          >
            {[
              { value: '10+', label: 'years active' },
              { value: '200+', label: 'projects' },
              { value: '3', label: 'disciplines' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="font-display text-2xl font-black text-gray-900 dark:text-white/85">{value}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-white/25">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          BIO — プロフィール写真 + テキスト
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.8fr]">
          {/* Left: photo + github */}
          <div className="flex flex-col gap-4">
            {/* Main visual — CMS で aboutMainVisual を差し替え可能。未設定時はエディトリアルなプレースホルダ。 */}
            <div className="w-full max-w-[280px] overflow-hidden rounded-3xl border border-gray-100 shadow-sm dark:border-white/[0.06]">
              <ResponsiveImage
                src={aboutVisualDesktop}
                mobileSrc={aboutVisualDesktop}
                alt={settings?.imageAltDefault ?? `${SITE_NAME} — portrait`}
                aspectRatio="3/4"
                focalPoint={settings?.heroFocalPoint ?? 'center'}
                fallbackClassName="bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
                fallback={
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span
                      className="font-display text-7xl font-black text-gray-200 dark:text-white/[0.07] select-none leading-none"
                      aria-hidden="true"
                    >
                      M
                    </span>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-300 dark:text-white/20">
                        mizzz · est. 2016
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-gray-200 dark:text-white/10">
                        film · photo · music
                      </span>
                    </div>
                  </div>
                }
              />
            </div>
            {aboutSubImages.length > 0 && (
              <div className="grid max-w-[280px] grid-cols-3 gap-2">
                {aboutSubImages.slice(0, 3).map((src, i) => (
                  <div
                    key={src}
                    className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.06]"
                  >
                    <ResponsiveImage
                      src={src}
                      alt=""
                      aspectRatio="1/1"
                      focalPoint="center"
                      className="h-full w-full"
                      priority={i === 0}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="max-w-[280px]">
              <GitHubActivityCard />
            </div>
          </div>

          {/* Right: bio text */}
          <div className="flex flex-col justify-center gap-6">
            <p className="text-base leading-[1.9] text-gray-600 dark:text-white/55">
              {t('about.bio1')}
            </p>
            <p className="text-base leading-[1.9] text-gray-600 dark:text-white/55">
              {t('about.bio2')}
            </p>
            <blockquote className="border-l-2 border-violet-300 dark:border-violet-500/40 pl-5">
              <p className="text-sm leading-relaxed text-gray-500 dark:text-white/40 italic">
                {t('about.approachText')}
              </p>
            </blockquote>
            <div className="pt-1">
              <p className={`font-mono text-[11px] ${avail ? avail.label : 'text-gray-400'}`}>
                {avail ? `— ${t(avail.key)}` : ''}
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          TIMELINE — クリエイティブ活動の歩み
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <div className="mb-10">
          <span className="section-label">{t('about.now', { defaultValue: 'timeline' })}</span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white/85">
            {t('about.timeline.title', { defaultValue: 'クリエイティブの歩み' })}
          </h2>
        </div>

        <div className="timeline-track relative space-y-10">
          {TIMELINE.map((item, i) => (
            <motion.div
              key={item.year}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="relative"
            >
              {/* dot */}
              <div className={`timeline-dot ${item.active ? 'timeline-dot-active' : ''}`} />

              {/* content */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-5">
                <span className="shrink-0 font-mono text-[11px] text-gray-400 dark:text-white/30 sm:w-12 sm:text-right">
                  {item.year}
                </span>
                <div>
                  <h3 className={`text-sm font-semibold ${item.active ? 'text-violet-600 dark:text-violet-400' : 'text-gray-800 dark:text-white/80'}`}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-white/40">
                    {item.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          VALUES — ブランドの価値観 (bento grid)
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <div className="mb-10">
          <span className="section-label">{t('about.values.label', { defaultValue: 'values' })}</span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white/85">
            {t('about.values.title', { defaultValue: '大切にしていること' })}
          </h2>
        </div>

        <div className="space-y-4">
          {/* Featured first value — full width row */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            variants={fadeUp}
            className="values-card group sm:flex sm:items-start sm:gap-10"
          >
            <div className="mb-3 flex items-center gap-3 sm:mb-0 sm:shrink-0">
              <span className="font-mono text-2xl text-violet-400 dark:text-violet-500 group-hover:scale-110 transition-transform duration-200">
                {VALUES[0].icon}
              </span>
              <h3 className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white/85">
                {VALUES[0].title}
              </h3>
            </div>
            <p className="text-base leading-relaxed text-gray-500 dark:text-white/40 sm:pt-0.5">
              {VALUES[0].desc}
            </p>
          </motion.div>

          {/* Remaining values — 3-column grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {VALUES.slice(1).map((v, i) => (
              <motion.div
                key={v.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={i + 1}
                variants={fadeUp}
                className="values-card group"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-xl text-violet-400 dark:text-violet-500 group-hover:scale-110 transition-transform duration-200">
                    {v.icon}
                  </span>
                  <h3 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white/85">
                    {v.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-white/40">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          SKILLS
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <span className="section-label">{t('about.skills', { defaultValue: 'skills' })}</span>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="card-editorial p-5"
            >
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-white/30">
                {skill.label}
              </h3>
              <ul className="space-y-2">
                {skill.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-white/65">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-300 dark:bg-violet-500/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          VISUAL QUOTE
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06]">
        <div className="visual-quote py-20">
          <div className="mb-10 text-center">
            <span className="section-label">{t('about.worldView', { defaultValue: 'world view' })}</span>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mx-auto max-w-2xl font-display text-2xl font-bold leading-[1.45] tracking-tight text-gray-800 dark:text-white/80 md:text-3xl">
              {t('about.approachText')}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-violet-300 dark:bg-violet-500/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400 dark:text-white/30">
                mizzz
              </span>
              <div className="h-px w-8 bg-violet-300 dark:bg-violet-500/50" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-gray-400 dark:text-white/30"
          >
            {t('about.worldviewDesc', { defaultValue: '映像・写真・音楽を横断することで、単一ジャンルでは届かない感情の層へ踏み込む。それがmizzzの目指すクリエイティブ。' })}
          </motion.p>
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <span className="section-label">{t('about.services', { defaultValue: 'services' })}</span>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="card-editorial group flex gap-4 p-5"
            >
              <span className="mt-0.5 shrink-0 font-mono text-xl text-gray-300 dark:text-white/15 group-hover:text-violet-400 dark:group-hover:text-violet-500 transition-colors duration-200">
                {svc.icon}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white/85">{svc.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-white/40">{svc.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          TOOLS
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <span className="section-label">{t('about.tools', { defaultValue: 'tools & stack' })}</span>

        <div className="mt-8 space-y-5">
          {TOOLS.map((group, i) => (
            <motion.div
              key={group.category}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="grid grid-cols-[80px_1fr] gap-4 items-start md:grid-cols-[120px_1fr]"
            >
              <span className="font-mono text-[9px] uppercase tracking-widest text-gray-300 dark:text-white/20 pt-0.5">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-2">
                {group.items.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md border border-gray-100 dark:border-white/[0.07] px-2.5 py-1 font-mono text-[11px] text-gray-500 dark:text-white/40"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          SOCIAL PROOF — 受賞・メディア掲載
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <span className="section-label">{t('about.socialProof', { defaultValue: 'recognition' })}</span>

        <div className="mt-8 space-y-0">
          {SOCIAL_PROOF.map((item, i) => (
            <motion.div
              key={item.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="flex items-center justify-between gap-4 border-b border-gray-50 dark:border-white/[0.04] py-4 last:border-0"
            >
              <div className="flex items-center gap-4">
                <span className="shrink-0 w-12 text-right font-mono text-[11px] text-gray-300 dark:text-white/20">
                  {item.year}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-white/70">{item.label}</span>
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-gray-300 dark:text-white/20">
                {item.category}
              </span>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          SELECTED WORKS
      ══════════════════════════════════════════════ */}
      {featuredWorks.length > 0 && (
        <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
          <div className="mb-8 flex items-center justify-between">
            <span className="section-label">{t('about.selectedWorks', { defaultValue: 'selected works' })}</span>
            <Link
              to={ROUTES.WORKS}
              className="font-mono text-[11px] text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
            >
              {t('about.ctaWorks', { defaultValue: '全作品を見る' })} →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featuredWorks.map((work, i) => (
              <motion.div
                key={work.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <Link
                  to={detailPath.work(work.slug)}
                  className="group relative block overflow-hidden rounded-xl bg-gray-100 dark:bg-white/[0.04]"
                  style={{ aspectRatio: '4/3' }}
                >
                  {getMediaUrl(work.thumbnail, 'small') ? (
                    <img
                      src={getMediaUrl(work.thumbnail, 'small')!}
                      alt={work.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="dot-grid flex h-full w-full items-center justify-center opacity-20">
                      <span className="font-mono text-[10px] text-gray-400">{work.category}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 translate-y-1 p-4 transition-transform duration-300 group-hover:translate-y-0">
                    {work.category && (
                      <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">
                        {work.category}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-white leading-tight line-clamp-2">{work.title}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </SectionReveal>
      )}

      {/* ══════════════════════════════════════════════
          FEATURED WRITING
      ══════════════════════════════════════════════ */}
      {featuredBlog.length > 0 && (
        <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
          <div className="mb-8 flex items-center justify-between">
            <span className="section-label">{t('about.featuredWriting', { defaultValue: 'writing' })}</span>
            <Link
              to={ROUTES.BLOG}
              className="font-mono text-[11px] text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
            >
              {t('home.latest.viewAll', { defaultValue: '全記事へ' })} →
            </Link>
          </div>
          <div className="space-y-0">
            {featuredBlog.map((post, i) => (
              <motion.div key={post.id} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
                <Link
                  to={detailPath.blog(post.slug)}
                  className="group flex items-start gap-5 border-b border-gray-50 dark:border-white/[0.04] py-5 last:border-0"
                >
                  {post.publishAt && (
                    <time
                      dateTime={post.publishAt}
                      className="hidden sm:block shrink-0 w-20 text-right font-mono text-[11px] text-gray-300 dark:text-white/20 pt-0.5"
                    >
                      {new Date(post.publishAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </time>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white/80 group-hover:text-gray-500 dark:group-hover:text-white/50 transition-colors line-clamp-2">
                      {post.title}
                    </p>
                    {post.publishAt && (
                      <p className="sm:hidden mt-1 font-mono text-[10px] text-gray-400 dark:text-white/25">
                        {formatDate(post.publishAt)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-gray-200 dark:text-white/15 group-hover:translate-x-0.5 group-hover:text-gray-500 dark:group-hover:text-white/40 transition-all duration-150 pt-0.5">
                    →
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </SectionReveal>
      )}

      {/* ══════════════════════════════════════════════
          PRICING TEASER
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-16">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center mb-6">
          <span className="section-label">{t('about.ctaPricing', { defaultValue: 'pricing' })}</span>
          <Link
            to={ROUTES.PRICING}
            className="font-mono text-[11px] text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
          >
            {t('pricing.title', { defaultValue: '料金を見る' })} →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PRICING_HIGHLIGHTS.map(({ label, from }, i) => (
            <motion.div
              key={label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="card-editorial p-4 space-y-1"
            >
              <p className="text-xs text-gray-500 dark:text-white/40">{label}</p>
              <p className="font-mono text-sm font-semibold text-gray-800 dark:text-white/75">{from}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] text-gray-400 dark:text-white/25">
          {t('pricing.note', { defaultValue: '※ 案件内容により変動します' })}
        </p>
      </SectionReveal>

      {/* ══════════════════════════════════════════════
          CTA — お問い合わせ導線
      ══════════════════════════════════════════════ */}
      <SectionReveal className="border-t border-gray-100 dark:border-white/[0.06] py-20">
        <div className="rounded-2xl bg-gray-50/60 px-8 py-10 dark:bg-white/[0.02]">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-white/25">
            next step
          </p>
          <h2 className="mb-7 font-display text-xl font-bold text-gray-900 dark:text-white/85">
            {t('about.ctaHeadline', { defaultValue: '一緒に、届く作品をつくりましょう。' })}
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <Link
              to={ROUTES.CONTACT}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {t('about.ctaContact', { defaultValue: 'お問い合わせ・仕事依頼' })}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              to={ROUTES.PRICING}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/[0.10] px-8 py-3.5 text-sm font-medium tracking-wide text-gray-700 dark:text-white/70 transition-all hover:border-gray-400 dark:hover:border-white/25"
            >
              {t('about.ctaPricing', { defaultValue: '料金を確認する' })}
            </Link>
            <Link
              to={ROUTES.WORKS}
              className="text-sm text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
            >
              {t('about.ctaWorks', { defaultValue: '作品一覧を見る' })} →
            </Link>
          </div>
        </div>
      </SectionReveal>
    </div>
  )
}
