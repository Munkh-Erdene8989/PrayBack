import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { AddToCartButton } from '@/components/storefront/AddToCartButton'

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!book) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Book Cover */}
        <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden">
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

        {/* Book Details */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">{book.author}</p>
          
          {book.category && (
            <p className="text-sm text-muted-foreground mb-2">
              Ангилал: {book.category}
            </p>
          )}
          
          {book.published_year && (
            <p className="text-sm text-muted-foreground mb-2">
              Хэвлэгдсэн он: {book.published_year}
            </p>
          )}
          
          {book.isbn && (
            <p className="text-sm text-muted-foreground mb-4">
              ISBN: {book.isbn}
            </p>
          )}

          <div className="border-t border-b py-4 my-6">
            <p className="text-3xl font-bold text-primary">
              {book.price.toLocaleString()}₮
            </p>
            {book.stock_quantity > 0 ? (
              <p className="text-sm text-green-600 mt-2">
                Нөөцөд {book.stock_quantity} ширхэг байгаа
              </p>
            ) : (
              <p className="text-sm text-red-600 mt-2">Дууссан</p>
            )}
          </div>

          <AddToCartButton book={book} />

          {book.description && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Тайлбар</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {book.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
