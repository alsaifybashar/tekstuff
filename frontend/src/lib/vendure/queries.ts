export const GET_PRODUCTS = `
  query GetProducts($options: ProductListOptions) {
    products(options: $options) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        variants {
          id
          name
          sku
          price
          priceWithTax
          stockLevel
        }
      }
      totalItems
    }
  }
`;

export const GET_PRODUCT = `
  query GetProduct($slug: String, $id: ID) {
    product(slug: $slug, id: $id) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
      variants {
        id
        name
        sku
        price
        priceWithTax
        stockLevel
      }
      facetValues {
        id
        name
        facet {
          id
          name
        }
      }
    }
  }
`;

export const GET_COLLECTIONS = `
  query GetCollections($options: CollectionListOptions) {
    collections(options: $options) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
      }
      totalItems
    }
  }
`;

export const GET_COLLECTION = `
  query GetCollection($slug: String, $id: ID) {
    collection(slug: $slug, id: $id) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
      }
      productVariants(options: { take: 50 }) {
        items {
          id
          product {
            id
            name
            slug
            featuredAsset {
              id
              preview
            }
          }
        }
        totalItems
      }
    }
  }
`;

export const GET_ACTIVE_ORDER = `
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      totalQuantity
      subTotal
      subTotalWithTax
      total
      totalWithTax
      currencyCode
      lines {
        id
        quantity
        linePriceWithTax
        productVariant {
          id
          name
          sku
          priceWithTax
          product {
            id
            name
            slug
            featuredAsset {
              id
              preview
            }
          }
        }
      }
    }
  }
`;
