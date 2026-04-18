import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks'
import { usePersonalization } from '../hooks/usePersonalization'
import type { PersonalizationEntityRef } from '../types'

interface FavoriteToggleButtonProps {
  item: PersonalizationEntityRef
  location: string
}

export default function FavoriteToggleButton({ item }: FavoriteToggleButtonProps) {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const { isFavorited, toggleFavoriteItem } = usePersonalization(user?.id)

  const active = useMemo(() => isFavorited(item.kind, item.slug), [isFavorited, item.kind, item.slug])

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => toggleFavoriteItem(item)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${active
        ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
        : 'border-gray-300 text-gray-600 hover:border-violet-300 hover:text-violet-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-700 dark:hover:text-violet-300'}`}
    >
      <span aria-hidden>{active ? '★' : '☆'}</span>
      <span>
        {active
          ? t('common.favoriteSaved', { defaultValue: 'お気に入り済み' })
          : t('common.favoriteAdd', { defaultValue: 'お気に入りに追加' })}
      </span>
    </button>
  )
}
