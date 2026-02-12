import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { AddToCartButton } from './AddToCartButton'
import { Book } from '@/types'

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/books/${book.id}`}>
        <div className="aspect-[3/4] bg-gray-200 relative">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 hover:text-primary">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
        <p className="text-lg font-bold text-primary">
          {book.price.toLocaleString()}₮
        </p>
        {book.stock_quantity > 0 ? (
          <p className="text-xs text-green-600">Нөөцөд байгаа</p>
        ) : (
          <p className="text-xs text-red-600">Дууссан</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <AddToCartButton book={book} />
      </CardFooter>
    </Card>
  )
}
