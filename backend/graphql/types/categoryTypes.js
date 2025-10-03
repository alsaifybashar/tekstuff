const { gql } = require('apollo-server-express');

const categoryTypes = gql`
  type Category implements Node {
    id: ID!
    name: String!
    slug: String!
    description: String
    parent: Category
    children: [Category!]!
    imageUrl: String
    isActive: Boolean!
    sortOrder: Int!
    metaTitle: String
    metaDescription: String
    productCount: Int!
    products(
      filter: ProductFilterInput
      sort: ProductSortInput
      pagination: PaginationInput
    ): ProductConnection!
    breadcrumbs: [Category!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CategoryConnection {
    edges: [CategoryEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CategoryEdge {
    node: Category!
    cursor: String!
  }

  input CreateCategoryInput {
    name: String!
    description: String
    parentId: ID
    isActive: Boolean = true
    sortOrder: Int = 0
    metaTitle: String
    metaDescription: String
  }

  input UpdateCategoryInput {
    name: String
    description: String
    parentId: ID
    isActive: Boolean
    sortOrder: Int
    metaTitle: String
    metaDescription: String
  }

  input CategoryFilterInput {
    parentId: ID
    isActive: Boolean
    hasProducts: Boolean
  }

  extend type Query {
    categories(
      filter: CategoryFilterInput
      pagination: PaginationInput
    ): CategoryConnection!
    category(id: ID, slug: String): Category
    rootCategories: [Category!]!
    categoryTree: [Category!]!
  }

  extend type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): ApiResponse!
    uploadCategoryImage(categoryId: ID!, image: Upload!): String!
    deleteCategoryImage(categoryId: ID!): ApiResponse!
  }
`;

module.exports = categoryTypes;