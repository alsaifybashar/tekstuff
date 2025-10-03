const { gql } = require('apollo-server-express');

const userTypes = gql`
  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  input UserFilterInput {
    role: [UserRole!]
    isVerified: Boolean
    search: String
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    phone: String
    role: UserRole
    isVerified: Boolean
  }

  extend type Query {
    users(
      filter: UserFilterInput
      pagination: PaginationInput
    ): UserConnection!
    user(id: ID!): User
  }

  extend type Mutation {
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): ApiResponse!
    uploadAvatar(image: Upload!): String!
    deleteAvatar: ApiResponse!
  }
`;

module.exports = userTypes;