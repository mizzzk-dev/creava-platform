import {
  applyQualitySnapshot,
  normalizeBaseEditorialFields,
  validateEditorialDateRange,
  validateWorkflowTransition,
  warnPriorityConflict,
} from '../../../../utils/editorial-workflow'

type Payload = {
  title?: string | null
  question?: string | null
  slug?: string | null
  locale?: string | null
  ctaText?: string | null
  ctaLink?: string | null
  publishAt?: string | null
  scheduledPublishAt?: string | null
  startAt?: string | null
  endAt?: string | null
  archiveAt?: string | null
  featured?: boolean | null
  pickup?: boolean | null
  displayPriority?: number | null
  seoTitle?: string | null
  seoDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  canonicalUrl?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  reviewComment?: string | null
  editorialWorkflowStatus?: 'draft' | 'review_pending' | 'approved' | 'scheduled' | 'published' | 'archived' | 'expired'
  translationCoverage?: Record<string, boolean> | null
  qualityWarnings?: string[] | null
  qualityScore?: number | null
}

function prepareData(data: Payload): void {
  if (!data) return

  if (!data.title && data.question) {
    data.title = data.question
  }

  normalizeBaseEditorialFields(data)

  if (!data.slug) {
    throw new Error('slug が生成できませんでした。タイトル/質問の英数字表記を確認してください。')
  }

  validateEditorialDateRange(data)
  validateWorkflowTransition(data)
  warnPriorityConflict(data, 'editorial-content')
  applyQualitySnapshot(data)
}

export default {
  beforeCreate(event: { params: { data: Payload } }) {
    prepareData(event.params.data)
  },
  beforeUpdate(event: { params: { data: Payload } }) {
    prepareData(event.params.data)
  },
}
