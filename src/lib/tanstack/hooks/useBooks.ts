"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";
import type { Book } from "@/types";

const GET_BOOKS = gql`
  query GetBooks($tenantId: ID!, $limit: Int, $offset: Int, $search: String) {
    books(tenantId: $tenantId, limit: $limit, offset: $offset, search: $search) {
      id
      tenant_id
      title
      author
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

const GET_BOOK = gql`
  query GetBook($id: ID!) {
    book(id: $id) {
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
      category {
        id
        name
      }
      is_active
      created_at
    }
  }
`;

interface UseBooksOptions {
  tenantId: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export function useBooks({
  tenantId,
  limit = 20,
  offset = 0,
  search,
}: UseBooksOptions) {
  return useQuery({
    queryKey: ["books", tenantId, limit, offset, search],
    queryFn: async () => {
      const data = await graphqlClient.request<{ books: Book[] }>(GET_BOOKS, {
        tenantId,
        limit,
        offset,
        search: search || undefined,
      });
      return data.books;
    },
    enabled: !!tenantId,
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        book: Book & { category?: { id: string; name: string } | null };
      }>(GET_BOOK, { id });
      return data.book;
    },
    enabled: !!id,
  });
}
