import { Helmet } from 'react-helmet-async'

interface PersonSchema {
  type: 'Person'
  name: string
  url: string
  description?: string
  sameAs?: string[]
}

interface WebSiteSchema {
  type: 'WebSite'
  name: string
  url: string
  description?: string
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

interface ServiceSchema {
  type: 'Service'
  name: string
  description?: string
  provider?: string
  providerUrl?: string
  url?: string
}

type SchemaProps =
  | PersonSchema
  | WebSiteSchema
  | FAQSchema
  | ArticleSchema
  | BreadcrumbSchema
  | ServiceSchema

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
    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: schema.name,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
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
    case 'Service':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: schema.name,
        ...(schema.description && { description: schema.description }),
        ...(schema.url && { url: schema.url }),
        ...(schema.provider && {
          provider: {
            '@type': 'Person',
            name: schema.provider,
            ...(schema.providerUrl && { url: schema.providerUrl }),
          },
        }),
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
