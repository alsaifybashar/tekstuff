import { GraphQLClient } from 'graphql-request';

const VENDURE_API_URL = process.env.REACT_APP_VENDURE_API_URL || 'http://localhost:3000/shop-api';

export const vendureClient = new GraphQLClient(VENDURE_API_URL, {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default vendureClient;
