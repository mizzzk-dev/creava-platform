export const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        handle
        title
        availableForSale
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        featuredImage {
          url
          altText
          width
          height
        }
      }
    }
  }
`

export const GET_PRODUCT_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 5) {
        nodes {
          url
          altText
          width
          height
        }
      }
      variants(first: 10) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
      tags
    }
  }
`
