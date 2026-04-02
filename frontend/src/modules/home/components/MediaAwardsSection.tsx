import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getMediaList, getAwardsList } from '@/modules/media/api'
import SectionHeader from '@/components/common/SectionHeader'
import type { MediaItem, Award } from '@/types'

export default function MediaAwardsSection() {
  const { t } = useTranslation()
  const media = useStrapiCollection<MediaItem>(() =>
    getMediaList({ pagination: { pageSize: 6 } }),
  )
  const awards = useStrapiCollection<Award>(() =>
    getAwardsList({ pagination: { pageSize: 6 } }),
  )

  const hasContent =
    (media.items && media.items.length > 0) ||
    (awards.items && awards.items.length > 0)

  if (!media.loading && !awards.loading && !hasContent) return null

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 py-20"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionHeader label={t('home.media.title')} />

      {(media.loading || awards.loading) && (
        <p className="mt-4 font-mono text-[11px] text-gray-300">{t('common.loading')}</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
        {awards.items && awards.items.length > 0 && (
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-gray-400">
              // awards
            </p>
            <ul className="space-y-0">
              {awards.items.map((award) => (
                <li
                  key={award.id}
                  className="group border-t border-gray-100 py-3 transition-colors hover:border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-900">{award.title}</p>
                  {(award.organization || award.year) && (
                    <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                      {[award.organization, award.year].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {media.items && media.items.length > 0 && (
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-gray-400">
              // press
            </p>
            <ul className="space-y-0">
              {media.items.map((item) => (
                <li
                  key={item.id}
                  className="group border-t border-gray-100 py-3 transition-colors hover:border-gray-200"
                >
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500"
                    >
                      {item.title}
                      <span className="ml-1 font-mono text-[10px] text-gray-300">↗</span>
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  )}
                  {item.source && (
                    <p className="mt-0.5 font-mono text-[11px] text-gray-400">{item.source}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.section>
  )
}
