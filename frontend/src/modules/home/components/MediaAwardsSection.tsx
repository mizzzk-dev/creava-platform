import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStrapiCollection } from '@/hooks'
import { getMediaList, getAwardsList } from '@/modules/media/api'
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
      <h2 className="text-xs uppercase tracking-widest text-gray-400">
        {t('home.media.title')}
      </h2>

      {(media.loading || awards.loading) && (
        <p className="mt-4 text-xs text-gray-400">{t('common.loading')}</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
        {awards.items && awards.items.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Awards
            </h3>
            <ul className="space-y-3">
              {awards.items.map((award) => (
                <li key={award.id} className="border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-900">{award.title}</p>
                  {(award.organization || award.year) && (
                    <p className="mt-0.5 text-xs text-gray-400">
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
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Media
            </h3>
            <ul className="space-y-3">
              {media.items.map((item) => (
                <li key={item.id} className="border-t border-gray-100 pt-3">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-900 transition-colors hover:text-gray-500"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-900">{item.title}</p>
                  )}
                  {item.source && (
                    <p className="mt-0.5 text-xs text-gray-400">{item.source}</p>
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
