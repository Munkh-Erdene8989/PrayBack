import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Book, CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (book: Book, quantity?: number) => void
  removeItem: (bookId: string) => void
  updateQuantity: (bookId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (book, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.book.id === book.id)
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.book.id === book.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }
          
          return {
            items: [...state.items, { book, quantity }],
          }
        })
      },
      
      removeItem: (bookId) => {
        set((state) => ({
          items: state.items.filter(item => item.book.id !== bookId),
        }))
      },
      
      updateQuantity: (bookId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(bookId)
          return
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.book.id === bookId
              ? { ...item, quantity }
              : item
          ),
        }))
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.book.price * item.quantity), 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
