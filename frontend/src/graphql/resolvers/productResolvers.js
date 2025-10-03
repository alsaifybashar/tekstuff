import { gql } from '@apollo/client';

// Product queries
export const GET_PRODUCTS = gql`
  query GetProducts(
    $filter: ProductFilterInput
    $sort: ProductSortInput
    $pagination: PaginationInput
  ) {
    products(filter: $filter, sort: $sort, pagination: $pagination) {
      edges {
        node {
          id
          name
          slug
          shortDescription
          price
          comparePrice
          stockStatus
          images {
            id
            url
            alt
            isPrimary
          }
          averageRating
          reviewCount
          isFeatured
          category {
            id
            name
            slug
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID, $slug: String) {
    product(id: $id, slug: $slug) {
      id
      name
      slug
      description
      shortDescription
      sku
      price
      comparePrice
      stockQuantity
      stockStatus
      images {
        id
        url
        alt
        isPrimary
        sortOrder
      }
      specifications
      features
      category {
        id
        name
        slug
        breadcrumbs {
          id
          name
          slug
        }
      }
      averageRating
      reviewCount
      relatedProducts(limit: 4) {
        id
        name
        slug
        price
        comparePrice
        images {
          id
          url
          alt
          isPrimary
        }
        averageRating
        reviewCount
      }
      reviews(first: 10) {
        edges {
          node {
            id
            rating
            title
            comment
            user {
              firstName
              lastName
              avatarUrl
            }
            createdAt
            isVerified
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`;

export const GET_FEATURED_PRODUCTS = gql`
  query GetFeaturedProducts($limit: Int) {
    featuredProducts(limit: $limit) {
      id
      name
      slug
      price
      comparePrice
      images {
        id
        url
        alt
        isPrimary
      }
      averageRating
      reviewCount
      stockStatus
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!, $limit: Int) {
    searchProducts(query: $query, limit: $limit) {
      id
      name
      slug
      price
      comparePrice
      images {
        id
        url
        alt
        isPrimary
      }
      averageRating
      reviewCount
      stockStatus
    }
  }
`;

// Category queries
export const GET_CATEGORIES = gql`
  query GetCategories($filter: CategoryFilterInput, $pagination: PaginationInput) {
    categories(filter: $filter, pagination: $pagination) {
      edges {
        node {
          id
          name
          slug
          description
          imageUrl
          productCount
          children {
            id
            name
            slug
            productCount
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`;

export const GET_CATEGORY = gql`
  query GetCategory($id: ID, $slug: String) {
    category(id: $id, slug: $slug) {
      id
      name
      slug
      description
      imageUrl
      productCount
      breadcrumbs {
        id
        name
        slug
      }
      children {
        id
        name
        slug
        productCount
      }
      products(
        filter: $filter
        sort: $sort
        pagination: $pagination
      ) {
        edges {
          node {
            id
            name
            slug
            price
            comparePrice
            stockStatus
            images {
              id
              url
              alt
              isPrimary
            }
            averageRating
            reviewCount
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`;

export const GET_ROOT_CATEGORIES = gql`
  query GetRootCategories {
    rootCategories {
      id
      name
      slug
      imageUrl
      productCount
    }
  }
`;

// Auth queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      fullName
      phone
      role
      avatarUrl
      isVerified
      createdAt
    }
  }
`;

// Cart queries
export const GET_CART = gql`
  query GetCart {
    cart {
      items {
        id
        product {
          id
          name
          slug
          price
          stockStatus
          images {
            id
            url
            alt
            isPrimary
          }
        }
        quantity
        total
      }
      subtotal
      totalItems
    }
  }
`;

// Order queries
export const GET_MY_ORDERS = gql`
  query GetMyOrders($pagination: PaginationInput) {
    myOrders(pagination: $pagination) {
      edges {
        node {
          id
          orderNumber
          status
          paymentStatus
          totalAmount
          currency
          items {
            id
            productName
            productSku
            price
            quantity
            total
          }
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID, $orderNumber: String) {
    order(id: $id, orderNumber: $orderNumber) {
      id
      orderNumber
      status
      paymentStatus
      paymentMethod
      subtotal
      taxAmount
      shippingAmount
      discountAmount
      totalAmount
      currency
      items {
        id
        product {
          id
          name
          slug
          images {
            id
            url
            alt
            isPrimary
          }
        }
        productName
        productSku
        price
        quantity
        total
      }
      billingAddress {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postalCode
        country
        phone
      }
      shippingAddress {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postalCode
        country
        phone
      }
      customerNotes
      trackingNumber
      createdAt
      updatedAt
      shippedAt
      deliveredAt
    }
  }
`;