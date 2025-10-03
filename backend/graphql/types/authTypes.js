const { gql } = require('apollo-server-express');

const authTypes = gql`
  type User implements Node {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    phone: String
    role: UserRole!
    isVerified: Boolean!
    avatarUrl: String
    lastLoginAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum UserRole {
    CUSTOMER
    ADMIN
    MANAGER
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    user: User
    accessToken: String
    refreshToken: String
  }

  type RefreshTokenPayload {
    success: Boolean!
    accessToken: String!
    refreshToken: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    password: String!
  }

  input VerifyEmailInput {
    token: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    phone: String
  }

  extend type Query {
    me: User
    verifyToken(token: String!): Boolean!
  }

  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: ApiResponse!
    refreshToken(refreshToken: String!): RefreshTokenPayload!
    forgotPassword(input: ForgotPasswordInput!): ApiResponse!
    resetPassword(input: ResetPasswordInput!): ApiResponse!
    verifyEmail(input: VerifyEmailInput!): ApiResponse!
    changePassword(input: ChangePasswordInput!): ApiResponse!
    updateProfile(input: UpdateProfileInput!): User!
  }
`;

module.exports = authTypes;