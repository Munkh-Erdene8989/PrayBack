"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";

// ---------------------------------------------------------------------------
// GraphQL documents
// ---------------------------------------------------------------------------

const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id
      status
      total_amount
      payment_status
      qpay_invoice_id
      created_at
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

const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      status
      total_amount
      payment_status
      qpay_invoice_id
      created_at
      items {
        id
        quantity
        unit_price
        book {
          id
          title
          author
          cover_image_url
        }
      }
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      status
      total_amount
      payment_status
      created_at
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

const CREATE_QPAY_INVOICE = gql`
  mutation CreateQPayInvoice($orderId: ID!) {
    createQPayInvoice(orderId: $orderId) {
      invoice_id
      qr_text
      qr_image
      qpay_short_url
      urls {
        name
        description
        logo
        link
      }
    }
  }
`;

const CHECK_ORDER_PAYMENT = gql`
  mutation CheckOrderPayment($orderId: ID!) {
    checkOrderPayment(orderId: $orderId) {
      paid
      order {
        id
        status
        payment_status
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QPayInvoiceData {
  createQPayInvoice: {
    invoice_id: string;
    qr_text: string;
    qr_image: string;
    qpay_short_url: string;
    urls: Array<{
      name: string;
      description: string;
      logo: string;
      link: string;
    }>;
  };
}

export interface PaymentCheckData {
  checkOrderPayment: {
    paid: boolean;
    order: {
      id: string;
      status: string;
      payment_status: string;
    } | null;
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => graphqlClient.request(GET_ORDERS),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => graphqlClient.request(GET_ORDER, { id }),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ book_id: string; quantity: number }>) =>
      graphqlClient.request(CREATE_ORDER, { input: { items } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      graphqlClient.request(CANCEL_ORDER, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCreateQPayInvoice() {
  return useMutation({
    mutationFn: (orderId: string) =>
      graphqlClient.request<QPayInvoiceData>(CREATE_QPAY_INVOICE, {
        orderId,
      }),
  });
}

export function useCheckOrderPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      graphqlClient.request<PaymentCheckData>(CHECK_ORDER_PAYMENT, {
        orderId,
      }),
    onSuccess: (data) => {
      if (data.checkOrderPayment.paid) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });
}
