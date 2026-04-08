import type { StoreProductSummary } from '@/modules/store/types'

export interface StoreCollection {
  slug: string
  name: string
  description: string
}

export const DEFAULT_COLLECTIONS: StoreCollection[] = [
  { slug: 'apparel', name: 'Apparel', description: 'Tシャツ・ウェアなどのアパレル商品。' },
  { slug: 'accessories', name: 'Accessories', description: 'バッグや日用品などのアクセサリー。' },
  { slug: 'digital', name: 'Digital Goods', description: 'デジタル配布商品や視聴コンテンツ。' },
  { slug: 'event', name: 'Event', description: 'イベント連動・会場販売連動の商品。' },
  { slug: 'limited', name: 'Limited', description: '期間限定・数量限定の商品。' },
]

const COLLECTION_KEYWORDS: Record<string, string[]> = {
  apparel: ['t-shirt', 'shirt', 'hoodie', 'アパレル', 'tシャツ', 'tee'],
  accessories: ['バッグ', 'bag', 'postcard', 'ポストカード', 'トート'],
  digital: ['digital', 'デジタル', 'download', '音源', 'pdf'],
  event: ['event', 'live', 'ticket', 'イベント', 'ライブ'],
  limited: ['limited', '限定'],
}

export function inferCollectionSlug(product: StoreProductSummary): string {
  const title = product.title.toLowerCase()
  if (product.accessStatus === 'limited') return 'limited'

  for (const [slug, keywords] of Object.entries(COLLECTION_KEYWORDS)) {
    if (keywords.some((keyword) => title.includes(keyword.toLowerCase()))) {
      return slug
    }
  }

  return 'accessories'
}
