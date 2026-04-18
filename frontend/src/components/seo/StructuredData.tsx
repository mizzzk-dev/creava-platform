import { Helmet } from 'react-helmet-async'

interface PersonSchema {
  type: 'Person'
  name: string
  url: string
  description?: string
  sameAs?: string[]
}

interface OrganizationSchema {
  type: 'Organization'
  name: string
  url: string
  logo?: string
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
  type: 'Article' | 'NewsArticle'
  headline: string
  description?: string
  datePublished?: string
  dateModified?: string
  image?: string
  authorName?: string
  url: string
}

interface EventSchema {
  type: 'Event'
  name: string
  description?: string
  startDate: string
  endDate?: string
  eventAttendanceMode?: string
  eventStatus?: string
  locationName?: string
  locationAddress?: string
  image?: string
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

interface CollectionPageSchema {
  type: 'CollectionPage'
  name: string
  description?: string
  url: string
}

interface ItemListSchema {
  type: 'ItemList'
  name: string
  url: string
  items: Array<{ name: string; url: string; position: number }>
}

interface HowToSchema {
  type: 'HowTo'
  name: string
  description?: string
  steps: Array<{ name: string; text: string; url?: string }>
}

interface ContactPageSchema {
  type: 'ContactPage'
  name: string
  description?: string
  url: string
}

interface ProfilePageSchema {
  type: 'ProfilePage'
  name: string
  description?: string
  url: string
}

type SchemaProps =
  | PersonSchema
  | OrganizationSchema
  | FAQSchema
  | ArticleSchema
  | EventSchema
  | BreadcrumbSchema
  | WebSiteSchema
  | ServiceSchema
  | ProductSchema
  | CollectionPageSchema
  | ItemListSchema
  | HowToSchema
  | ContactPageSchema
  | ProfilePageSchema

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
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: schema.name,
        url: schema.url,
        ...(schema.logo && { logo: schema.logo }),
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
    case 'NewsArticle':
      return {
        '@context': 'https://schema.org',
        '@type': schema.type,
        headline: schema.headline,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
        ...(schema.datePublished && { datePublished: schema.datePublished }),
        ...(schema.dateModified && { dateModified: schema.dateModified }),
        ...(schema.image && { image: schema.image }),
        ...(schema.authorName && {
          author: { '@type': 'Person', name: schema.authorName },
        }),
      }
    case 'Event':
      return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: schema.name,
        startDate: schema.startDate,
        url: schema.url,
        ...(schema.endDate && { endDate: schema.endDate }),
        ...(schema.description && { description: schema.description }),
        ...(schema.eventAttendanceMode && { eventAttendanceMode: schema.eventAttendanceMode }),
        ...(schema.eventStatus && { eventStatus: schema.eventStatus }),
        ...(schema.image && { image: schema.image }),
        ...(schema.locationName && {
          location: {
            '@type': 'Place',
            name: schema.locationName,
            ...(schema.locationAddress && { address: schema.locationAddress }),
          },
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
    case 'CollectionPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: schema.name,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
      }
    case 'ItemList':
      return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: schema.name,
        url: schema.url,
        itemListElement: schema.items.map((item) => ({
          '@type': 'ListItem',
          position: item.position,
          url: item.url,
          name: item.name,
        })),
      }
    case 'HowTo':
      return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: schema.name,
        ...(schema.description && { description: schema.description }),
        step: schema.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
          ...(step.url && { url: step.url }),
        })),
      }
    case 'ContactPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: schema.name,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
      }
    case 'ProfilePage':
      return {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: schema.name,
        url: schema.url,
        ...(schema.description && { description: schema.description }),
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
