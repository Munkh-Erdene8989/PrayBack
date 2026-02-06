"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CartItem, Book } from "@/types";

const CART_KEY = ["cart"];

/**
 * Client-side cart stored in memory via TanStack Query cache.
 * For persistence, the cart could also be stored in localStorage.
 */

function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cart", JSON.stringify(items));
}

export function useCart() {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery<CartItem[]>({
    queryKey: CART_KEY,
    queryFn: () => getStoredCart(),
    staleTime: Infinity,
  });

  const addToCart = useMutation({
    mutationFn: async ({ book, quantity = 1 }: { book: Book; quantity?: number }) => {
      const current = queryClient.getQueryData<CartItem[]>(CART_KEY) ?? [];
      const existing = current.find((item) => item.book.id === book.id);

      let updated: CartItem[];
      if (existing) {
        updated = current.map((item) =>
          item.book.id === book.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...current, { book, quantity }];
      }

      saveCart(updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_KEY, data);
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (bookId: string) => {
      const current = queryClient.getQueryData<CartItem[]>(CART_KEY) ?? [];
      const updated = current.filter((item) => item.book.id !== bookId);
      saveCart(updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_KEY, data);
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ bookId, quantity }: { bookId: string; quantity: number }) => {
      const current = queryClient.getQueryData<CartItem[]>(CART_KEY) ?? [];
      const updated = current.map((item) =>
        item.book.id === bookId ? { ...item, quantity } : item
      );
      saveCart(updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_KEY, data);
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      saveCart([]);
      return [] as CartItem[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_KEY, data);
    },
  });

  const totalAmount = items.reduce(
    (sum, item) => sum + item.book.price * item.quantity,
    0
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}
