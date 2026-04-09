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

function assertDateRange(data: FanclubPayload): void {
  if (!data.startAt || !data.endAt) return

  const start = new Date(data.startAt)
  const end = new Date(data.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return

  if (start.getTime() > end.getTime()) {
    throw new Error('公開開始日時 startAt は終了日時 endAt より前に設定してください。')
  }
}

function warnIncompleteEditorial(data: FanclubPayload): void {
  if (data.weeklyHighlight && !data.heroCopy?.trim()) {
    strapi.log.warn('[fanclub-content] weeklyHighlight が有効ですが heroCopy が未設定です。見出しコピーを確認してください。')
  }

  if ((data.ctaText && !data.ctaLink) || (!data.ctaText && data.ctaLink)) {
    strapi.log.warn('[fanclub-content] CTA text/link が片方のみ設定されています。導線切れを確認してください。')
  }

  if (typeof data.displayPriority === 'number' && data.displayPriority > 9000) {
    strapi.log.warn('[fanclub-content] displayPriority が極端に高い値です。並び順競合に注意してください。')
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

  if (data.title) {
    data.title = data.title.trim()
  }

  if (data.slug) {
    data.slug = normalizeSlug(data.slug)
  } else if (data.title) {
    data.slug = normalizeSlug(data.title)
  }

  if (mode === 'create' && !data.slug) {
    throw new Error('slug が生成できませんでした。英数字ベースのタイトルを設定してください。')
  }

  assertDateRange(data)
  warnIncompleteEditorial(data)
}

export default {
  beforeCreate(event: { params: { data: FanclubPayload } }) {
    validateData(event.params.data, 'create')
  },
  beforeUpdate(event: { params: { data: FanclubPayload } }) {
    validateData(event.params.data, 'update')
  },
}
