"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";
import type { Book } from "@/types";

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const GET_ADMIN_BOOKS = gql`
  query GetAdminBooks($tenantId: ID!, $limit: Int, $offset: Int, $search: String) {
    adminBooks(tenantId: $tenantId, limit: $limit, offset: $offset, search: $search) {
      id
      tenant_id
      title
      author
      isbn
      description
      price
      cover_image_url
      stock
      category_id
      is_active
      created_at
    }
  }
`;

const CREATE_BOOK = gql`
  mutation CreateBook($input: CreateBookInput!) {
    createBook(input: $input) {
      id
      title
      author
      price
      stock
      is_active
      created_at
    }
  }
`;

const UPDATE_BOOK = gql`
  mutation UpdateBook($id: ID!, $input: UpdateBookInput!) {
    updateBook(id: $id, input: $input) {
      id
      title
      author
      price
      stock
      is_active
      created_at
    }
  }
`;

const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id)
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateBookInput {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price: number;
  cover_image_url?: string;
  stock: number;
  category_id?: string;
  is_active?: boolean;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  isbn?: string;
  description?: string;
  price?: number;
  cover_image_url?: string;
  stock?: number;
  category_id?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

interface UseAdminBooksOptions {
  tenantId: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export function useAdminBooks({
  tenantId,
  limit = 50,
  offset = 0,
  search,
}: UseAdminBooksOptions) {
  return useQuery({
    queryKey: ["adminBooks", tenantId, limit, offset, search],
    queryFn: async () => {
      const data = await graphqlClient.request<{ adminBooks: Book[] }>(
        GET_ADMIN_BOOKS,
        {
          tenantId,
          limit,
          offset,
          search: search || undefined,
        }
      );
      return data.adminBooks;
    },
    enabled: !!tenantId,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookInput) =>
      graphqlClient.request(CREATE_BOOK, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBooks"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookInput }) =>
      graphqlClient.request(UPDATE_BOOK, { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBooks"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => graphqlClient.request(DELETE_BOOK, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBooks"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
