import { shopifyFetch } from '@/lib/shopify/client'
import { GET_PRODUCTS_QUERY, GET_PRODUCT_QUERY } from '@/lib/shopify/queries'
import type {
  ShopifyProductsResponse,
  ShopifyProductResponse,
  ShopifyProductSummary,
  ShopifyProduct,
} from '@/lib/shopify/types'

/**
 * 商品一覧を取得する
 */
export async function getProducts(first = 12): Promise<ShopifyProductSummary[]> {
  const data = await shopifyFetch<ShopifyProductsResponse>(GET_PRODUCTS_QUERY, { first })
  return data.products.nodes
}

/**
 * handle で商品詳細を取得する
 * 見つからない場合は null を返す
 */
export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<ShopifyProductResponse>(GET_PRODUCT_QUERY, { handle })
  return data.product ?? null
}

/**
 * Shopify の商品ページ URL を生成する（チェックアウト導線用）
 */
export function shopifyProductUrl(domain: string, handle: string): string {
  return `https://${domain}/products/${handle}`
}
