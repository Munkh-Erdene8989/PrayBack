'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { Book } from '@/types'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  book: Book
}

export function AddToCartButton({ book }: AddToCartButtonProps) {
  const { addItem, items } = useCartStore()
  const isInCart = items.some(item => item.book.id === book.id)

  const handleAddToCart = () => {
    if (isInCart) {
      toast.info('Энэ ном аль хэдийн сагсанд байна')
      return
    }

    addItem(book)
    toast.success('Сагсанд нэмэгдлээ')
  }

  return (
    <Button 
      className="w-full" 
      size="lg"
      onClick={handleAddToCart}
      disabled={isInCart}
    >
      {isInCart ? 'Сагсанд байгаа' : 'Сагсанд нэмэх'}
    </Button>
  )
}
