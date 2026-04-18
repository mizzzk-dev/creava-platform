import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  addReaction,
  createCommunityPost,
  getReactionSnapshot,
  listCommunityPosts,
  markEventParticipation,
  reportCommunityPost,
} from '@/modules/community/storage'
import type { CommunityContentType, EventParticipationState, ReactionType, SourceSite } from '@/modules/community/types'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

interface Props {
  sourceSite: SourceSite
  contentType: CommunityContentType
  entityId: string
}

const REACTIONS: ReactionType[] = ['cheer', 'curious', 'joined']
const EVENT_STATES: EventParticipationState[] = ['interested', 'planning', 'attended']

export default function CommunityEngagementPanel({ sourceSite, contentType, entityId }: Props) {
  const { t, i18n } = useTranslation()
  const { user, isSignedIn } = useCurrentUser()
  const [body, setBody] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const reactionSnapshot = useMemo(
    () => getReactionSnapshot(sourceSite, contentType, entityId),
    [sourceSite, contentType, entityId, refreshKey],
  )

  const posts = useMemo(
    () => listCommunityPosts(sourceSite, contentType, entityId),
    [sourceSite, contentType, entityId, refreshKey],
  )

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/60 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">community</p>
          <h2 className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{t('community.panelTitle')}</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('community.panelDescription')}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {REACTIONS.map((reaction) => (
          <button
            key={reaction}
            type="button"
            onClick={() => {
              addReaction({ sourceSite, contentType, entityId, reactionType: reaction, userId: user?.id, locale: i18n.language })
              setRefreshKey((value) => value + 1)
            }}
            className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <span>{t(`community.reaction.${reaction}`)}</span>
            <span className="font-mono">{reactionSnapshot[reaction]}</span>
          </button>
        ))}
      </div>

      {contentType === 'event' && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('community.eventParticipationLabel')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EVENT_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => {
                  markEventParticipation({ sourceSite, contentType, entityId, state, userId: user?.id, locale: i18n.language })
                  trackMizzzEvent('participation_intent_click', { sourceSite, contentType, entityId, eventParticipationState: state })
                }}
                className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-200"
              >
                {t(`community.eventState.${state}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{t('community.postTitle')}</p>
        {!isSignedIn && <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">{t('community.loginRequired')}</p>}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, 280))}
          placeholder={t('community.postPlaceholder')}
          rows={3}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[11px] text-gray-400">{body.length}/280</span>
          <button
            type="button"
            disabled={!isSignedIn || body.trim().length < 4}
            onClick={() => {
              if (!user) return
              trackMizzzEvent('ugc_create_start', { sourceSite, contentType, entityId })
              createCommunityPost({
                userId: user.id,
                sourceSite,
                contentType,
                entityId,
                body: body.trim(),
                locale: i18n.language,
              })
              setBody('')
              setRefreshKey((value) => value + 1)
            }}
            className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('community.postSubmit')}
          </button>
        </div>
      </div>

      {posts.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('community.recentPosts')}</p>
          {posts.slice(0, 3).map((post) => (
            <article key={post.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-950/40">
              <p className="text-xs text-gray-700 dark:text-gray-200">{post.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wide text-gray-400">{post.moderationStatus}</span>
                <button
                  type="button"
                  className="text-[11px] text-rose-500 hover:underline"
                  onClick={() => {
                    reportCommunityPost({ postId: post.id, reporterUserId: user?.id, reason: 'abuse' })
                  }}
                >
                  {t('community.report')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
