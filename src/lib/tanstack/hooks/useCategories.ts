"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";
import type { Category } from "@/types";

const GET_CATEGORIES = gql`
  query GetCategories($tenantId: ID!) {
    categories(tenantId: $tenantId) {
      id
      name
      parent_id
    }
  }
`;

export function useCategories(tenantId: string) {
  return useQuery({
    queryKey: ["categories", tenantId],
    queryFn: async () => {
      const data = await graphqlClient.request<{ categories: Category[] }>(
        GET_CATEGORIES,
        { tenantId }
      );
      return data.categories;
    },
    enabled: !!tenantId,
  });
}
