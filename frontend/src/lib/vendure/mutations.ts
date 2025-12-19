export const ADD_TO_CART = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
        code
        totalQuantity
        subTotalWithTax
        totalWithTax
        lines {
          id
          quantity
          linePriceWithTax
          productVariant {
            id
            name
            sku
            priceWithTax
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADJUST_ORDER_LINE = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        id
        totalQuantity
        lines {
          id
          quantity
          linePriceWithTax
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const REMOVE_FROM_CART = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        id
        totalQuantity
        lines {
          id
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;
