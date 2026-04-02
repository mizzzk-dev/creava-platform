import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getMediaList, getAwardsList } from '@/modules/media/api'
import SectionHeader from '@/components/common/SectionHeader'
import type { MediaItem, Award } from '@/types/content'

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
        <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-gray-100 pt-3">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton mt-2 h-2.5 w-28 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Awards column */}
        {awards.items && awards.items.length > 0 && (
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-gray-400">
              // awards
            </p>
            <ul>
              {awards.items.map((award) => (
                <li
                  key={award.id}
                  className="group flex items-start gap-4 border-t border-gray-100 py-3.5 transition-colors hover:border-gray-200"
                >
                  {/* year — prominent mono label */}
                  {award.year && (
                    <span className="w-10 shrink-0 font-mono text-[11px] text-gray-300 group-hover:text-gray-400">
                      {award.year}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{award.title}</p>
                    {award.organization && (
                      <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                        {award.organization}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Press/Media column */}
        {media.items && media.items.length > 0 && (
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-gray-400">
              // press
            </p>
            <ul>
              {media.items.map((item) => (
                <li
                  key={item.id}
                  className="group border-t border-gray-100 py-3.5 transition-colors hover:border-gray-200"
                >
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <p className="text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-500 leading-snug">
                        {item.title}
                        <span className="ml-1.5 font-mono text-[10px] text-gray-300 group-hover:text-gray-400">↗</span>
                      </p>
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 leading-snug">{item.title}</p>
                  )}
                  {item.source && (
                    <span className="mt-1.5 inline-block rounded-sm border border-gray-100 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">
                      {item.source}
                    </span>
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
