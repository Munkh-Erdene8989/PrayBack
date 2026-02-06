import { GraphQLClient } from "graphql-request";

/**
 * GraphQL client for frontend usage with graphql-request.
 * Used inside TanStack Query hooks to send queries/mutations.
 */
export const graphqlClient = new GraphQLClient("/api/graphql");

/**
 * Set the Authorization header for authenticated requests.
 */
export function setAuthToken(token: string | null) {
  if (token) {
    graphqlClient.setHeader("Authorization", `Bearer ${token}`);
  } else {
    graphqlClient.setHeader("Authorization", "");
  }
}
