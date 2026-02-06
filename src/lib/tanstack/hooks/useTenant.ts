"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";

const GET_TENANT = gql`
  query GetTenant($slug: String!) {
    tenant(slug: $slug) {
      id
      name
      slug
      logo_url
      theme_config
      created_at
    }
  }
`;

export function useTenant(slug: string) {
  return useQuery({
    queryKey: ["tenant", slug],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        tenant: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          theme_config: Record<string, unknown> | null;
          created_at: string;
        } | null;
      }>(GET_TENANT, { slug });
      return data.tenant;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // Cache tenant info for 5 minutes
  });
}
