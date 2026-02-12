'use client'

import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Таны сагс хоосон байна</h1>
        <Link href="/books">
          <Button>Ном үзэх</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Сагс</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.book.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-32 bg-gray-200 rounded flex-shrink-0">
                    {item.book.cover_image_url ? (
                      <img
                        src={item.book.cover_image_url}
                        alt={item.book.title}
                        className="object-cover w-full h-full rounded"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link href={`/books/${item.book.id}`}>
                      <h3 className="font-semibold hover:text-primary">
                        {item.book.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.book.author}
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      {item.book.price.toLocaleString()}₮
                    </p>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                          disabled={item.quantity >= item.book.stock_quantity}
                        >
                          +
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.book.id)}
                      >
                        Устгах
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      {(item.book.price * item.quantity).toLocaleString()}₮
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Захиалгын дүн</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Нийт дүн:</span>
                  <span>{getTotalPrice().toLocaleString()}₮</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Хүргэлт:</span>
                  <span>Тооцоолох</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Нийт:</span>
                  <span className="text-primary">
                    {getTotalPrice().toLocaleString()}₮
                  </span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full" size="lg">
                  Төлбөр төлөх
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
