export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyImage {
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export interface ShopifyProductVariant {
  id: string
  title: string
  availableForSale: boolean
  price: ShopifyMoney
  selectedOptions: { name: string; value: string }[]
}

/** 一覧表示用の軽量型 */
export interface ShopifyProductSummary {
  id: string
  handle: string
  title: string
  availableForSale: boolean
  priceRange: {
    minVariantPrice: ShopifyMoney
  }
  featuredImage: ShopifyImage | null
}

/** 詳細ページ用のフル型 */
export interface ShopifyProduct extends ShopifyProductSummary {
  description: string
  descriptionHtml: string
  priceRange: {
    minVariantPrice: ShopifyMoney
    maxVariantPrice: ShopifyMoney
  }
  images: { nodes: ShopifyImage[] }
  variants: { nodes: ShopifyProductVariant[] }
  tags: string[]
}

/** GraphQL レスポンス型 */
export interface ShopifyProductsResponse {
  products: { nodes: ShopifyProductSummary[] }
}

export interface ShopifyProductResponse {
  product: ShopifyProduct | null
}
