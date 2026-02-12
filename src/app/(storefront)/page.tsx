import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/storefront/BookCard'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Номын дэлгүүрт тавтай морил
          </h1>
          <p className="text-xl mb-8">
            Таны хүссэн номыг хамгийн тохиромжтой үнээр
          </p>
          <Link href="/books">
            <Button size="lg" variant="secondary">
              Ном үзэх
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Онцлох номууд</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {books?.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/books">
              <Button variant="outline">Бүх номыг үзэх</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
