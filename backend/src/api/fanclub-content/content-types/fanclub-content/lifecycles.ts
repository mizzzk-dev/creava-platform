import {
  applyQualitySnapshot,
  normalizeBaseEditorialFields,
  validateEditorialDateRange,
  validateWorkflowTransition,
  warnPriorityConflict,
} from '../../../../utils/editorial-workflow'

interface FanclubPayload {
  title?: string | null
  slug?: string | null
  heroCopy?: string | null
  heroVisual?: unknown
  ctaText?: string | null
  ctaLink?: string | null
  startAt?: string | null
  endAt?: string | null
  displayPriority?: number | null
  weeklyHighlight?: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: unknown
  editorialWorkflowStatus?: 'draft' | 'review_pending' | 'approved' | 'scheduled' | 'published' | 'archived' | 'expired'
  publishAt?: string | null
  scheduledPublishAt?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  archiveAt?: string | null
  reviewComment?: string | null
  translationCoverage?: Record<string, boolean> | null
}

function warnIncompleteEditorial(data: FanclubPayload): void {
  if (data.weeklyHighlight && !data.heroCopy?.trim()) {
    strapi.log.warn('[fanclub-content] weeklyHighlight が有効ですが heroCopy が未設定です。見出しコピーを確認してください。')
  }

  if ((data.ctaText && !data.ctaLink) || (!data.ctaText && data.ctaLink)) {
    strapi.log.warn('[fanclub-content] CTA text/link が片方のみ設定されています。導線切れを確認してください。')
  }

  if (data.heroCopy && (data.heroVisual === null || data.heroVisual === undefined)) {
    strapi.log.warn('[fanclub-content] heroCopy は設定されていますが heroVisual が未設定です。プレビューで視認性を確認してください。')
  }

  if ((data.seoTitle || data.seoDescription) && (data.ogImage === null || data.ogImage === undefined)) {
    strapi.log.warn('[fanclub-content] SEO情報があるのに OGP画像が未設定です。共有時の品質を確認してください。')
  }
}

function validateData(data: FanclubPayload, mode: 'create' | 'update'): void {
  if (!data) return

  if (mode === 'create' && (!data.title || !data.title.trim())) {
    throw new Error('タイトルは必須です。')
  }

  normalizeBaseEditorialFields(data)

  if (mode === 'create' && !data.slug) {
    throw new Error('slug が生成できませんでした。英数字ベースのタイトルを設定してください。')
  }

  validateEditorialDateRange(data)
  validateWorkflowTransition(data)
  warnPriorityConflict(data, 'fanclub-content')
  warnIncompleteEditorial(data)
  applyQualitySnapshot(data)
}

export default {
  beforeCreate(event: { params: { data: FanclubPayload } }) {
    validateData(event.params.data, 'create')
  },
  beforeUpdate(event: { params: { data: FanclubPayload } }) {
    validateData(event.params.data, 'update')
  },
}
