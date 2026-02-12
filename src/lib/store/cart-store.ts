import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Book, CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (book: Book) => void
  removeItem: (bookId: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (book) => {
        set((state) => {
          const existingItem = state.items.find(item => item.book.id === book.id)
          
          // For digital books, don't add duplicates - one copy per book
          if (existingItem) {
            return state
          }
          
          return {
            items: [...state.items, { book }],
          }
        })
      },
      
      removeItem: (bookId) => {
        set((state) => ({
          items: state.items.filter(item => item.book.id !== bookId),
        }))
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotalItems: () => {
        return get().items.length
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.book.price, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
