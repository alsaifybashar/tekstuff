const { gql } = require('apollo-server-express');
const { mergeResolvers, mergeTypeDefs } = require('@graphql-tools/merge');
const path = require('path');
const fs = require('fs');

function safeRequire(p) {
  try {
    const full = path.resolve(__dirname, p);
    if (fs.existsSync(full) || fs.existsSync(full + '.js')) {
      return require(full);
    }
  } catch (_) {}
  return null;
}

// ---- TYPES (only load if present) ----
const authTypes     = safeRequire('./types/authTypes');
const productTypes  = safeRequire('./types/productTypes');
const categoryTypes = safeRequire('./types/categoryTypes');
const orderTypes    = safeRequire('./types/orderTypes');
const userTypes     = safeRequire('./types/userTypes');

// ---- RESOLVERS (fix path for auth; guard optional ones) ----
const authResolvers     = safeRequire('./resolvers/authResolvers');
const productResolvers  = safeRequire('./resolvers/productResolvers');
const categoryResolvers = safeRequire('./resolvers/categoryResolvers');
const orderResolvers    = safeRequire('./resolvers/orderResolvers');
const userResolvers     = safeRequire('./resolvers/userResolvers');

// ---- Base schema ----
const baseTypes = gql`
  scalar Upload
  scalar DateTime
  scalar JSON

  type Query { _empty: String }
  type Mutation { _empty: String }
  type Subscription { _empty: String }

  interface Node { id: ID! }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  type ApiResponse {
    success: Boolean!
    message: String!
  }
`;

// Only merge items that actually loaded
const typeDefs = mergeTypeDefs(
  [baseTypes, authTypes, productTypes, categoryTypes, orderTypes, userTypes].filter(Boolean)
);

const resolvers = mergeResolvers(
  [authResolvers, productResolvers, categoryResolvers, orderResolvers, userResolvers].filter(Boolean)
);

module.exports = { typeDefs, resolvers };
