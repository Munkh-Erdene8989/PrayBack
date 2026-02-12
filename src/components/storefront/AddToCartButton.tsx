'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { Book } from '@/types'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  book: Book
}

export function AddToCartButton({ book }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    if (book.stock_quantity <= 0) {
      toast.error('Энэ ном дууссан байна')
      return
    }

    addItem(book, 1)
    toast.success('Сагсанд нэмэгдлээ')
  }

  return (
    <Button 
      className="w-full" 
      size="lg"
      onClick={handleAddToCart}
      disabled={book.stock_quantity <= 0}
    >
      {book.stock_quantity > 0 ? 'Сагсанд нэмэх' : 'Дууссан'}
    </Button>
  )
}
