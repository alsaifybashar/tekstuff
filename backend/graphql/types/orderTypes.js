const { gql } = require('apollo-server-express');

const orderTypes = gql`
  type Order implements Node {
    id: ID!
    orderNumber: String!
    user: User!
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    paymentMethod: String
    paymentIntentId: String
    subtotal: Float!
    taxAmount: Float!
    shippingAmount: Float!
    discountAmount: Float!
    totalAmount: Float!
    currency: String!
    items: [OrderItem!]!
    billingAddress: Address!
    shippingAddress: Address!
    customerNotes: String
    adminNotes: String
    trackingNumber: String
    shippedAt: DateTime
    deliveredAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderItem {
    id: ID!
    product: Product
    productName: String!
    productSku: String!
    price: Float!
    quantity: Int!
    total: Float!
    productSnapshot: JSON
  }

  type Address {
    firstName: String!
    lastName: String!
    company: String
    address1: String!
    address2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    phone: String
  }

  enum OrderStatus {
    PENDING
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
  }

  type OrderConnection {
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type OrderEdge {
    node: Order!
    cursor: String!
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
    billingAddress: AddressInput!
    shippingAddress: AddressInput!
    paymentMethod: String!
    customerNotes: String
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }

  input AddressInput {
    firstName: String!
    lastName: String!
    company: String
    address1: String!
    address2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    phone: String
  }

  input UpdateOrderInput {
    status: OrderStatus
    paymentStatus: PaymentStatus
    trackingNumber: String
    adminNotes: String
  }

  input OrderFilterInput {
    userId: ID
    status: [OrderStatus!]
    paymentStatus: [PaymentStatus!]
    dateFrom: DateTime
    dateTo: DateTime
  }

  type Cart {
    items: [CartItem!]!
    subtotal: Float!
    totalItems: Int!
  }

  type CartItem {
    id: ID!
    product: Product!
    quantity: Int!
    total: Float!
  }

  input AddToCartInput {
    productId: ID!
    quantity: Int!
  }

  input UpdateCartItemInput {
    productId: ID!
    quantity: Int!
  }

  extend type Query {
    orders(
      filter: OrderFilterInput
      pagination: PaginationInput
    ): OrderConnection!
    order(id: ID, orderNumber: String): Order
    myOrders(pagination: PaginationInput): OrderConnection!
    cart: Cart!
  }

  extend type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrder(id: ID!, input: UpdateOrderInput!): Order!
    cancelOrder(id: ID!, reason: String): Order!
    addToCart(input: AddToCartInput!): CartItem!
    updateCartItem(input: UpdateCartItemInput!): CartItem!
    removeFromCart(productId: ID!): ApiResponse!
    clearCart: ApiResponse!
    createPaymentIntent(orderId: ID!): String!
  }
`;

module.exports = orderTypes;