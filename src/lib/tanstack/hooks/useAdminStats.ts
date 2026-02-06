"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($tenantId: ID!) {
    dashboardStats(tenantId: $tenantId) {
      totalBooks
      activeBooks
      totalOrders
      pendingOrders
      paidOrders
      totalRevenue
      recentOrders {
        id
        status
        total_amount
        payment_status
        created_at
        user {
          id
          name
          phone
        }
        items {
          id
          quantity
          unit_price
          book {
            id
            title
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalBooks: number;
  activeBooks: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    status: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
    user: { id: string; name: string | null; phone: string } | null;
    items: Array<{
      id: string;
      quantity: number;
      unit_price: number;
      book: { id: string; title: string } | null;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminStats(tenantId: string) {
  return useQuery({
    queryKey: ["adminStats", tenantId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        dashboardStats: DashboardStats;
      }>(GET_DASHBOARD_STATS, { tenantId });
      return data.dashboardStats;
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
