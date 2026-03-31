export class ShopifyApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
  ) {
    super(message)
    this.name = 'ShopifyApiError'
  }
}

function getShopifyConfig(): { domain: string; token: string } {
  const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
  const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN
  if (!domain) throw new ShopifyApiError(0, 'Config', '[Shopify] VITE_SHOPIFY_STORE_DOMAIN is not set')
  if (!token) throw new ShopifyApiError(0, 'Config', '[Shopify] VITE_SHOPIFY_STOREFRONT_TOKEN is not set')
  return { domain, token }
}

export async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { domain, token } = getShopifyConfig()
  const url = `https://${domain}/api/2024-01/graphql.json`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new ShopifyApiError(
      res.status,
      res.statusText,
      `[Shopify] ${res.status} ${res.statusText} — ${url}`,
    )
  }

  const json = (await res.json()) as { data?: T; errors?: unknown[] }

  if (json.errors) {
    throw new ShopifyApiError(0, 'GraphQL Error', `[Shopify] ${JSON.stringify(json.errors)}`)
  }
  if (!json.data) {
    throw new ShopifyApiError(0, 'No data', '[Shopify] Response contained no data')
  }

  return json.data
}
