import { Helmet } from 'react-helmet-async'

interface PersonSchema {
  type: 'Person'
  name: string
  url: string
  description?: string
  sameAs?: string[]
}

interface FAQItem {
  question: string
  answer: string
}

interface FAQSchema {
  type: 'FAQPage'
  items: FAQItem[]
}

interface ArticleSchema {
  type: 'Article'
  headline: string
  description?: string
  datePublished?: string
  image?: string
  authorName?: string
  url: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchema {
  type: 'BreadcrumbList'
  items: BreadcrumbItem[]
}

interface WebSiteSchema {
  type: 'WebSite'
  name: string
  url: string
  description?: string
}

interface ServiceSchema {
  type: 'Service'
  name: string
  description?: string
  providerName: string
  providerUrl: string
  areaServed?: string
  serviceType?: string
}

interface ProductSchema {
  type: 'Product'
  name: string
  description?: string
  image?: string
  price: number
  priceCurrency: string
  availability: 'InStock' | 'OutOfStock' | 'PreOrder'
  url: string
  sellerName?: string
}

type SchemaProps =
  | PersonSchema
  | FAQSchema
  | ArticleSchema
  | BreadcrumbSchema
  | WebSiteSchema
  | ServiceSchema
  | ProductSchema

function buildJsonLd(schema: SchemaProps): object {
  switch (schema.type) {
    case 'Person':
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: schema.name,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
        ...(schema.sameAs && schema.sameAs.length > 0 && { sameAs: schema.sameAs }),
      }
    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: schema.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: schema.headline,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
        ...(schema.datePublished && { datePublished: schema.datePublished }),
        ...(schema.image && { image: schema.image }),
        ...(schema.authorName && {
          author: { '@type': 'Person', name: schema.authorName },
        }),
      }
    case 'BreadcrumbList':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: schema.items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }
    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: schema.name,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
        potentialAction: {
          '@type': 'SearchAction',
          target: `${schema.url}/works?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }
    case 'Service':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: schema.name,
        ...(schema.description && { description: schema.description }),
        provider: {
          '@type': 'Person',
          name: schema.providerName,
          url: schema.providerUrl,
        },
        ...(schema.areaServed && { areaServed: schema.areaServed }),
        ...(schema.serviceType && { serviceType: schema.serviceType }),
      }
    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: schema.name,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
        ...(schema.image && { image: schema.image }),
        offers: {
          '@type': 'Offer',
          price: schema.price,
          priceCurrency: schema.priceCurrency,
          availability: `https://schema.org/${schema.availability}`,
          url: schema.url,
          ...(schema.sellerName && {
            seller: { '@type': 'Person', name: schema.sellerName },
          }),
        },
      }
  }
}

export default function StructuredData({ schema }: { schema: SchemaProps }) {
  const jsonLd = buildJsonLd(schema)
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}
