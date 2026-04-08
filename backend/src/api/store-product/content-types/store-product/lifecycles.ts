interface StoreProductPayload {
  title?: string | null
  slug?: string | null
  price?: number | null
  previewImage?: unknown
  purchaseStatus?: 'available' | 'soldout' | 'coming_soon'
  featured?: boolean
  isNewArrival?: boolean
  sortOrder?: number
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

function ensureStoreProductData(data: StoreProductPayload) {
  if (!data.title || !data.title.trim()) {
    throw new Error('商品タイトルは必須です。')
  }

  if (typeof data.price !== 'number' || Number.isNaN(data.price) || data.price < 0) {
    throw new Error('価格は 0 以上の数値で入力してください。')
  }

  if (!data.slug || !data.slug.trim()) {
    data.slug = normalizeSlug(data.title)
  } else {
    data.slug = normalizeSlug(data.slug)
  }

  if (!data.slug) {
    throw new Error('slug が生成できませんでした。英数字のタイトルを設定してください。')
  }

  if (!data.previewImage) {
    strapi.log.warn('[store-product] previewImage 未設定で保存されました。公開前に画像設定を確認してください。')
  }

  if (data.purchaseStatus === 'coming_soon' && data.price === 0) {
    strapi.log.warn('[store-product] coming_soon 商品の価格が 0 円です。意図した設定か確認してください。')
  }

  data.featured = Boolean(data.featured)
  data.isNewArrival = Boolean(data.isNewArrival)
  if (typeof data.sortOrder !== 'number') {
    data.sortOrder = 0
  }
}

export default {
  beforeCreate(event: { params: { data: StoreProductPayload } }) {
    const data = event.params.data
    ensureStoreProductData(data)
    data.title = data.title?.trim() ?? ''
  },
  beforeUpdate(event: { params: { data: StoreProductPayload } }) {
    const data = event.params.data
    if (!data) return
    if (data.title) data.title = data.title.trim()
    if (data.slug) data.slug = normalizeSlug(data.slug)

    if (data.title || data.slug || data.price !== undefined || data.previewImage !== undefined) {
      ensureStoreProductData(data)
    }
  },
}
