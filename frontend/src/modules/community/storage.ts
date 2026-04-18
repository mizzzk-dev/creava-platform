import { trackMizzzEvent } from '@/modules/analytics/tracking'
import type {
  CommunityPostItem,
  CommunityReportItem,
  CommunityContentType,
  EventParticipationState,
  ParticipationLogItem,
  ReactionType,
  SourceSite,
} from '@/modules/community/types'

const REACTIONS_KEY = 'creava.community.reactions.v1'
const LOGS_KEY = 'creava.community.logs.v1'
const POSTS_KEY = 'creava.community.posts.v1'
const REPORTS_KEY = 'creava.community.reports.v1'

interface ReactionRecord {
  entityKey: string
  reactionType: ReactionType
  count: number
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function entityKey(sourceSite: SourceSite, contentType: CommunityContentType, entityId: string): string {
  return `${sourceSite}:${contentType}:${entityId}`
}

export function getReactionSnapshot(sourceSite: SourceSite, contentType: CommunityContentType, entityId: string): Record<ReactionType, number> {
  const key = entityKey(sourceSite, contentType, entityId)
  const records = readJson<ReactionRecord[]>(REACTIONS_KEY, [])
  return {
    cheer: records.find((item) => item.entityKey === key && item.reactionType === 'cheer')?.count ?? 0,
    curious: records.find((item) => item.entityKey === key && item.reactionType === 'curious')?.count ?? 0,
    joined: records.find((item) => item.entityKey === key && item.reactionType === 'joined')?.count ?? 0,
  }
}

export function addReaction(input: {
  sourceSite: SourceSite
  contentType: CommunityContentType
  entityId: string
  reactionType: ReactionType
  userId?: string | null
  locale?: string
}): void {
  const key = entityKey(input.sourceSite, input.contentType, input.entityId)
  const reactions = readJson<ReactionRecord[]>(REACTIONS_KEY, [])
  const idx = reactions.findIndex((item) => item.entityKey === key && item.reactionType === input.reactionType)
  if (idx >= 0) {
    reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1 }
  } else {
    reactions.push({ entityKey: key, reactionType: input.reactionType, count: 1 })
  }
  writeJson(REACTIONS_KEY, reactions)
  appendParticipationLog({
    userId: input.userId ?? null,
    sourceSite: input.sourceSite,
    locale: input.locale ?? 'ja',
    contentType: input.contentType,
    entityId: input.entityId,
    participationType: 'reaction',
    reactionType: input.reactionType,
    engagementScore: 1,
  })
  trackMizzzEvent('reaction_add', {
    sourceSite: input.sourceSite,
    contentType: input.contentType,
    entityId: input.entityId,
    reactionType: input.reactionType,
    userState: input.userId ? 'logged_in' : 'guest',
  })
}

export function markEventParticipation(input: {
  sourceSite: SourceSite
  contentType: CommunityContentType
  entityId: string
  state: EventParticipationState
  userId?: string | null
  locale?: string
}): void {
  appendParticipationLog({
    userId: input.userId ?? null,
    sourceSite: input.sourceSite,
    locale: input.locale ?? 'ja',
    contentType: input.contentType,
    entityId: input.entityId,
    participationType: 'intent',
    eventParticipationState: input.state,
    engagementScore: input.state === 'attended' ? 4 : 2,
  })
  trackMizzzEvent('event_participation_mark', {
    sourceSite: input.sourceSite,
    contentType: input.contentType,
    entityId: input.entityId,
    eventParticipationState: input.state,
    userState: input.userId ? 'logged_in' : 'guest',
  })
}

function appendParticipationLog(item: Omit<ParticipationLogItem, 'id' | 'createdAt'>): void {
  const logs = readJson<ParticipationLogItem[]>(LOGS_KEY, [])
  logs.unshift({
    ...item,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
  })
  writeJson(LOGS_KEY, logs.slice(0, 300))
}

export function listParticipationHistory(userId?: string | null): ParticipationLogItem[] {
  const logs = readJson<ParticipationLogItem[]>(LOGS_KEY, [])
  if (!userId) return logs.slice(0, 50)
  return logs.filter((item) => item.userId === userId).slice(0, 100)
}

export function createCommunityPost(input: {
  userId: string
  sourceSite: SourceSite
  contentType: CommunityContentType
  entityId: string
  body: string
  locale?: string
}): CommunityPostItem {
  const posts = readJson<CommunityPostItem[]>(POSTS_KEY, [])
  const now = new Date().toISOString()
  const created: CommunityPostItem = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
    userId: input.userId,
    sourceSite: input.sourceSite,
    locale: input.locale ?? 'ja',
    contentType: input.contentType,
    entityId: input.entityId,
    body: input.body,
    visibility: 'pending_review',
    accessLevel: input.sourceSite === 'fc' ? 'member' : 'logged_in',
    moderationStatus: 'pending_review',
    reportStatus: 'open',
    featuredCommunityPost: false,
    createdAt: now,
    updatedAt: now,
  }
  posts.unshift(created)
  writeJson(POSTS_KEY, posts.slice(0, 300))
  appendParticipationLog({
    userId: input.userId,
    sourceSite: input.sourceSite,
    locale: input.locale ?? 'ja',
    contentType: input.contentType,
    entityId: input.entityId,
    participationType: 'ugc_post',
    engagementScore: 5,
  })
  trackMizzzEvent('ugc_submit_success', {
    sourceSite: input.sourceSite,
    contentType: input.contentType,
    entityId: input.entityId,
    moderationStatus: 'pending_review',
  })
  return created
}

export function listCommunityPosts(sourceSite: SourceSite, contentType: CommunityContentType, entityId: string): CommunityPostItem[] {
  return readJson<CommunityPostItem[]>(POSTS_KEY, []).filter((item) => item.sourceSite === sourceSite && item.contentType === contentType && item.entityId === entityId)
}

export function reportCommunityPost(input: {
  postId: string
  reporterUserId?: string | null
  reason: CommunityReportItem['reason']
  details?: string
}): CommunityReportItem {
  const reports = readJson<CommunityReportItem[]>(REPORTS_KEY, [])
  const created: CommunityReportItem = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
    postId: input.postId,
    reporterUserId: input.reporterUserId ?? null,
    reason: input.reason,
    details: input.details,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  reports.unshift(created)
  writeJson(REPORTS_KEY, reports.slice(0, 500))
  trackMizzzEvent('report_submit', { postId: input.postId, reason: input.reason, userState: input.reporterUserId ? 'logged_in' : 'guest' })
  return created
}
