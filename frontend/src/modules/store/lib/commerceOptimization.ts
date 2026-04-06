import type { StoreProductSummary } from '@/modules/store/types'
import type { BlogPost, NewsItem } from '@/types'
import type { MemberOrder } from '@/modules/member/types'

const HISTORY_STORAGE_KEY = 'creava.recommendation.history'
const AB_STORAGE_KEY = 'creava.store.ab-variants'

export type MemberSegment = 'guest' | 'member' | 'admin'
export type HistoryKind = 'product' | 'news' | 'blog'

interface HistoryItem {
  kind: HistoryKind
  slug: string
  at: string
}

interface HistoryPayload {
  items: HistoryItem[]
}

interface SalesVelocityInput {
  productId: number
  productTitle: string
  stockUnits: number
  soldUnitsLast7d: number
  restockLeadDays: number
  notifyWaitlist: number
}

export interface StockoutForecast {
  productId: number
  productTitle: string
  daysUntilStockout: number
  estimatedStockoutDate: string
  shouldAlert: boolean
  suggestedNotifyAudience: number
}

export interface MemberProfileForSegment {
  memberId: string
  favoritesCount: number
  restockRequests: number
  orderCount: number
  lastOrderAt: string | null
}

export interface CrmSegmentResult {
  highIntent: string[]
  loyal: string[]
  reactivation: string[]
}

export interface LtvInput {
  memberId: string
  firstOrderAt: string
  latestOrderAt: string
  totalOrderCount: number
  acquisition: 'organic' | 'social' | 'ads' | 'direct'
}

export interface LtvDashboard {
  retentionRate: number
  repurchaseRate: number
  cvrByAcquisition: Record<LtvInput['acquisition'], number>
}

export interface RegionCommercePolicy {
  region: 'JP' | 'US' | 'EU' | 'ROW'
  currency: 'JPY' | 'USD' | 'EUR'
  shippingFee: number
  taxRate: number
  canShip: boolean
  deliveryEstimateDays: string
}

export function trackViewHistory(kind: HistoryKind, slug: string): void {
  if (typeof window === 'undefined') return
  const current = loadHistoryPayload()
  const filtered = current.items.filter((item) => !(item.kind === kind && item.slug === slug))
  const next: HistoryPayload = {
    items: [{ kind, slug, at: new Date().toISOString() }, ...filtered].slice(0, 60),
  }
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
}

function loadHistoryPayload(): HistoryPayload {
  if (typeof window === 'undefined') return { items: [] }
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
  if (!raw) return { items: [] }
  try {
    const parsed = JSON.parse(raw) as HistoryPayload
    if (!Array.isArray(parsed.items)) return { items: [] }
    return parsed
  } catch {
    return { items: [] }
  }
}

export function getHistoryByKind(kind: HistoryKind): string[] {
  return loadHistoryPayload()
    .items
    .filter((item) => item.kind === kind)
    .map((item) => item.slug)
}

export function getPersonalizedProducts(products: StoreProductSummary[], memberSegment: MemberSegment, limit = 3): StoreProductSummary[] {
  const viewed = new Set(getHistoryByKind('product'))
  return [...products]
    .filter((product) => product.accessStatus !== 'fc_only' || memberSegment !== 'guest')
    .sort((a, b) => {
      const viewedScoreA = viewed.has(a.slug) ? 3 : 0
      const viewedScoreB = viewed.has(b.slug) ? 3 : 0
      const segmentScoreA = memberSegment !== 'guest' && a.accessStatus === 'limited' ? 2 : 0
      const segmentScoreB = memberSegment !== 'guest' && b.accessStatus === 'limited' ? 2 : 0
      const statusScoreA = a.purchaseStatus === 'available' ? 1 : 0
      const statusScoreB = b.purchaseStatus === 'available' ? 1 : 0
      return viewedScoreB + segmentScoreB + statusScoreB - (viewedScoreA + segmentScoreA + statusScoreA)
    })
    .slice(0, limit)
}

export function getPersonalizedArticles(news: NewsItem[], blog: BlogPost[], limit = 4): Array<NewsItem | BlogPost> {
  const viewedNews = new Set(getHistoryByKind('news'))
  const viewedBlog = new Set(getHistoryByKind('blog'))

  const scored = [
    ...news.map((item) => ({ item, score: (viewedNews.has(item.slug) ? 3 : 0) + (item.accessStatus === 'limited' ? 1 : 0) })),
    ...blog.map((item) => ({ item, score: (viewedBlog.has(item.slug) ? 3 : 0) + (item.tags.length > 0 ? 1 : 0) })),
  ]

  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.item).slice(0, limit)
}

export function forecastStockout(inputs: SalesVelocityInput[]): StockoutForecast[] {
  const today = new Date()
  return inputs.map((input) => {
    const dailyVelocity = input.soldUnitsLast7d / 7
    const daysUntilStockout = dailyVelocity <= 0 ? 999 : Math.max(0, Math.floor(input.stockUnits / dailyVelocity))
    const stockoutDate = new Date(today)
    stockoutDate.setDate(today.getDate() + daysUntilStockout)
    const shouldAlert = daysUntilStockout <= input.restockLeadDays
    const suggestedNotifyAudience = shouldAlert ? Math.max(input.notifyWaitlist, Math.ceil(input.soldUnitsLast7d * 1.2)) : 0

    return {
      productId: input.productId,
      productTitle: input.productTitle,
      daysUntilStockout,
      estimatedStockoutDate: stockoutDate.toISOString().slice(0, 10),
      shouldAlert,
      suggestedNotifyAudience,
    }
  })
}

export function buildCrmSegments(members: MemberProfileForSegment[]): CrmSegmentResult {
  const now = new Date()
  const highIntent: string[] = []
  const loyal: string[] = []
  const reactivation: string[] = []

  for (const member of members) {
    if (member.favoritesCount + member.restockRequests >= 4) highIntent.push(member.memberId)
    if (member.orderCount >= 3) loyal.push(member.memberId)

    if (!member.lastOrderAt) {
      reactivation.push(member.memberId)
      continue
    }

    const lastOrder = new Date(member.lastOrderAt)
    const daysSinceOrder = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceOrder >= 60) {
      reactivation.push(member.memberId)
    }
  }

  return { highIntent, loyal, reactivation }
}

export function buildLtvDashboard(rows: LtvInput[]): LtvDashboard {
  if (rows.length === 0) {
    return {
      retentionRate: 0,
      repurchaseRate: 0,
      cvrByAcquisition: { organic: 0, social: 0, ads: 0, direct: 0 },
    }
  }

  const retained = rows.filter((row) => {
    const first = new Date(row.firstOrderAt)
    const latest = new Date(row.latestOrderAt)
    return Math.floor((latest.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)) >= 30
  }).length
  const repurchased = rows.filter((row) => row.totalOrderCount >= 2).length

  const cvrByAcquisition: LtvDashboard['cvrByAcquisition'] = { organic: 0, social: 0, ads: 0, direct: 0 }
  const acquisitionDenominator: Record<LtvInput['acquisition'], number> = { organic: 0, social: 0, ads: 0, direct: 0 }

  rows.forEach((row) => {
    acquisitionDenominator[row.acquisition] += 1
    if (row.totalOrderCount >= 1) cvrByAcquisition[row.acquisition] += 1
  })

  ;(Object.keys(cvrByAcquisition) as Array<keyof typeof cvrByAcquisition>).forEach((key) => {
    const denominator = acquisitionDenominator[key] || 1
    cvrByAcquisition[key] = Math.round((cvrByAcquisition[key] / denominator) * 100)
  })

  return {
    retentionRate: Math.round((retained / rows.length) * 100),
    repurchaseRate: Math.round((repurchased / rows.length) * 100),
    cvrByAcquisition,
  }
}

export function getRegionCommercePolicy(region: RegionCommercePolicy['region']): RegionCommercePolicy {
  const policies: Record<RegionCommercePolicy['region'], RegionCommercePolicy> = {
    JP: { region: 'JP', currency: 'JPY', shippingFee: 800, taxRate: 0.1, canShip: true, deliveryEstimateDays: '2-4' },
    US: { region: 'US', currency: 'USD', shippingFee: 18, taxRate: 0.07, canShip: true, deliveryEstimateDays: '5-10' },
    EU: { region: 'EU', currency: 'EUR', shippingFee: 16, taxRate: 0.2, canShip: true, deliveryEstimateDays: '6-12' },
    ROW: { region: 'ROW', currency: 'USD', shippingFee: 28, taxRate: 0, canShip: false, deliveryEstimateDays: '-' },
  }

  return policies[region]
}

export type AbTestKey = 'storeHero' | 'storeRanking' | 'storeCta'

export function getAbVariant(testKey: AbTestKey): 'A' | 'B' {
  if (typeof window === 'undefined') return 'A'
  const raw = window.localStorage.getItem(AB_STORAGE_KEY)
  const parsed = raw ? (JSON.parse(raw) as Partial<Record<AbTestKey, 'A' | 'B'>>) : {}
  const existing = parsed[testKey]
  if (existing) return existing

  const next = Math.random() > 0.5 ? 'B' : 'A'
  const payload = { ...parsed, [testKey]: next }
  window.localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(payload))
  return next
}

export function buildSupportTemplates(orders: MemberOrder[]) {
  const latest = orders[0]
  if (!latest) return []

  return [
    {
      id: 'order-status',
      label: '注文状況の確認',
      body: `注文番号 ${latest.externalOrderId} の現在のステータスを確認したいです。`,
    },
    {
      id: 'shipping-delay',
      label: '配送遅延の相談',
      body: `注文番号 ${latest.externalOrderId} の配送状況について、到着予定日を確認したいです。`,
    },
    {
      id: 'change-address',
      label: '配送先変更の相談',
      body: `注文番号 ${latest.externalOrderId} について、発送前であれば配送先変更を希望します。`,
    },
  ]
}
