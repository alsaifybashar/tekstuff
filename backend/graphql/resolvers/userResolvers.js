const { pool } = require('../../config/database');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');

const userResolvers = {
  Query: {
    users: async (_, { filter = {}, pagination = {} }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Access denied. Admin role required.');
      }

      // Return empty result for now - implement later
      return {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0
      };
    }
  }
};

module.exports = userResolvers;