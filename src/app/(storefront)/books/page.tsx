'use client'

import { useEffect, useState } from 'react'
import { BookCard } from '@/components/storefront/BookCard'
import { Input } from '@/components/ui/input'
import { Book } from '@/types'

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBooks()
  }, [search])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/books?${params}`)
      const data = await res.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Бүх номууд</h1>
      
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Ном хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Уншиж байна...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Ном олдсонгүй
        </div>
      )}
    </div>
  )
}
