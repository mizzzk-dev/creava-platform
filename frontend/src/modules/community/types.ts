export type SourceSite = 'main' | 'store' | 'fc'

export type CommunityContentType = 'event' | 'fanclub' | 'product' | 'news' | 'guide' | 'campaign'

export type ParticipationType = 'reaction' | 'intent' | 'ugc_post' | 'event_report'

export type ReactionType = 'cheer' | 'curious' | 'joined'

export type EventParticipationState = 'interested' | 'planning' | 'attended'

export type CommunityVisibility = 'public' | 'member_only' | 'private' | 'pending_review'

export type CommunityAccessLevel = 'public' | 'logged_in' | 'member' | 'premium'

export type ModerationStatus = 'draft' | 'pending_review' | 'published' | 'hidden' | 'rejected' | 'archived' | 'reported'

export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'rejected'

export interface ParticipationLogItem {
  id: string
  userId: string | null
  sourceSite: SourceSite
  locale: string
  contentType: CommunityContentType
  entityId: string
  participationType: ParticipationType
  reactionType?: ReactionType
  eventParticipationState?: EventParticipationState
  engagementScore: number
  createdAt: string
}

export interface CommunityPostItem {
  id: string
  userId: string
  sourceSite: SourceSite
  locale: string
  contentType: CommunityContentType
  entityId: string
  body: string
  visibility: CommunityVisibility
  accessLevel: CommunityAccessLevel
  moderationStatus: ModerationStatus
  reportStatus: ReportStatus
  featuredCommunityPost: boolean
  createdAt: string
  updatedAt: string
}

export interface CommunityReportItem {
  id: string
  postId: string
  reporterUserId: string | null
  reason: 'spam' | 'abuse' | 'copyright' | 'privacy' | 'other'
  details?: string
  status: ReportStatus
  createdAt: string
}
