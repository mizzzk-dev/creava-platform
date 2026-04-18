export type EditorialWorkflowStatus = 'draft' | 'review_pending' | 'approved' | 'scheduled' | 'published' | 'archived' | 'expired'

interface EditorialPayload {
  title?: string | null
  slug?: string | null
  locale?: string | null
  publishAt?: string | null
  scheduledPublishAt?: string | null
  startAt?: string | null
  endAt?: string | null
  limitedEndAt?: string | null
  archiveAt?: string | null
  featured?: boolean | null
  pickup?: boolean | null
  displayPriority?: number | null
  ctaText?: string | null
  ctaLink?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  canonicalUrl?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  reviewComment?: string | null
  editorialWorkflowStatus?: EditorialWorkflowStatus | null
  qualityScore?: number | null
  qualityWarnings?: string[] | null
  translationCoverage?: Record<string, boolean> | null
}

const AVAILABLE_LOCALES = ['ja', 'en', 'ko']

function isValidDate(value?: string | null): boolean {
  if (!value) return false
  return !Number.isNaN(new Date(value).getTime())
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function normalizeBaseEditorialFields(data: EditorialPayload): void {
  if (typeof data.title === 'string') {
    data.title = data.title.trim()
  }

  if (typeof data.slug === 'string') {
    data.slug = normalizeSlug(data.slug)
  } else if (data.title) {
    data.slug = normalizeSlug(data.title)
  }

  if (!data.editorialWorkflowStatus) {
    data.editorialWorkflowStatus = 'draft'
  }

  if (!data.translationCoverage || typeof data.translationCoverage !== 'object') {
    data.translationCoverage = {
      ja: data.locale === 'ja' || !data.locale,
      en: data.locale === 'en',
      ko: data.locale === 'ko',
    }
  }
}

export function validateEditorialDateRange(data: EditorialPayload): void {
  if (data.startAt && data.endAt && isValidDate(data.startAt) && isValidDate(data.endAt)) {
    if (new Date(data.startAt).getTime() > new Date(data.endAt).getTime()) {
      throw new Error('公開開始日時 startAt は終了日時 endAt より前に設定してください。')
    }
  }

  if (data.publishAt && data.endAt && isValidDate(data.publishAt) && isValidDate(data.endAt)) {
    if (new Date(data.publishAt).getTime() > new Date(data.endAt).getTime()) {
      throw new Error('publishAt が endAt より後になっています。公開期間を見直してください。')
    }
  }

  if (data.scheduledPublishAt && data.endAt && isValidDate(data.scheduledPublishAt) && isValidDate(data.endAt)) {
    if (new Date(data.scheduledPublishAt).getTime() > new Date(data.endAt).getTime()) {
      throw new Error('scheduledPublishAt が endAt より後になっています。')
    }
  }
}

export function buildEditorialWarnings(data: EditorialPayload): string[] {
  const warnings: string[] = []

  if (!data.title?.trim()) warnings.push('title未設定')
  if (!data.slug?.trim()) warnings.push('slug未設定')

  if ((data.ctaText && !data.ctaLink) || (!data.ctaText && data.ctaLink)) {
    warnings.push('CTA設定が不完全')
  }

  if (!data.seoTitle?.trim()) warnings.push('seoTitle未設定')
  if (!data.seoDescription?.trim()) warnings.push('seoDescription未設定')
  if (!data.ogTitle?.trim()) warnings.push('ogTitle未設定')
  if (!data.ogDescription?.trim()) warnings.push('ogDescription未設定')

  if (!data.canonicalUrl?.trim()) warnings.push('canonicalUrl未設定')

  if (typeof data.displayPriority === 'number' && data.displayPriority > 9000) {
    warnings.push('displayPriorityが極端に高い')
  }

  const coverage = data.translationCoverage ?? {}
  const missingLocales = AVAILABLE_LOCALES.filter((locale) => coverage[locale] !== true)
  if (missingLocales.length > 0) {
    warnings.push(`翻訳未完了: ${missingLocales.join(',')}`)
  }

  if (data.editorialWorkflowStatus === 'scheduled' && !isValidDate(data.scheduledPublishAt ?? data.publishAt)) {
    warnings.push('scheduledなのに公開日時未設定')
  }

  if (data.editorialWorkflowStatus === 'approved') {
    if (!data.approvedBy?.trim()) warnings.push('approvedBy未設定')
    if (!isValidDate(data.approvedAt)) warnings.push('approvedAt未設定')
  }

  return warnings
}

export function applyQualitySnapshot(data: EditorialPayload): void {
  const warnings = buildEditorialWarnings(data)
  data.qualityWarnings = warnings
  data.qualityScore = Math.max(0, 100 - warnings.length * 10)
}

export function validateWorkflowTransition(data: EditorialPayload): void {
  const status = data.editorialWorkflowStatus
  if (!status) return

  if (status === 'review_pending' && !data.reviewComment?.trim()) {
    throw new Error('review_pending へ移行する場合は reviewComment を入力してください。')
  }

  if ((status === 'approved' || status === 'scheduled' || status === 'published') && !data.approvedBy?.trim()) {
    throw new Error(`${status} へ移行する場合は approvedBy を入力してください。`)
  }

  if ((status === 'approved' || status === 'scheduled' || status === 'published') && !isValidDate(data.approvedAt)) {
    throw new Error(`${status} へ移行する場合は approvedAt を入力してください。`)
  }

  if (status === 'scheduled' && !isValidDate(data.scheduledPublishAt ?? data.publishAt)) {
    throw new Error('scheduled へ移行する場合は scheduledPublishAt または publishAt が必要です。')
  }

  if (status === 'archived' && !isValidDate(data.archiveAt)) {
    throw new Error('archived へ移行する場合は archiveAt を入力してください。')
  }
}

export function warnPriorityConflict(data: EditorialPayload, type: string): void {
  if (data.featured && data.pickup && typeof data.displayPriority === 'number' && data.displayPriority > 100) {
    strapi.log.warn(`[${type}] featured/pickup/displayPriority が強く競合しています。公開面を確認してください。`)
  }
}
