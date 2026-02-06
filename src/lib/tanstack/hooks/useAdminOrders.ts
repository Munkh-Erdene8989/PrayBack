"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";
import type { OrderStatus } from "@/types";

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const GET_ADMIN_ORDERS = gql`
  query GetOrders {
    orders {
      id
      tenant_id
      user_id
      status
      total_amount
      payment_status
      qpay_invoice_id
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
          cover_image_url
        }
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
      payment_status
    }
  }
`;

const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!) {
    cancelOrder(id: $id) {
      id
      status
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminOrder {
  id: string;
  tenant_id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_status: string;
  qpay_invoice_id: string | null;
  created_at: string;
  user: { id: string; name: string | null; phone: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    book: {
      id: string;
      title: string;
      cover_image_url: string | null;
    } | null;
  }>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAdminOrders() {
  return useQuery({
    queryKey: ["adminOrders"],
    queryFn: async () => {
      const data = await graphqlClient.request<{ orders: AdminOrder[] }>(
        GET_ADMIN_ORDERS
      );
      return data.orders;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      graphqlClient.request(UPDATE_ORDER_STATUS, { id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useAdminCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      graphqlClient.request(CANCEL_ORDER, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
