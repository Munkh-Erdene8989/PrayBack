'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function EditBookPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    price: '',
    category: '',
    published_year: '',
    cover_image_url: '',
  })

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Book not found')
        return res.json()
      })
      .then(({ book }) => {
        setFormData({
          title: book.title ?? '',
          author: book.author ?? '',
          isbn: book.isbn ?? '',
          description: book.description ?? '',
          price: String(book.price ?? ''),
          category: book.category ?? '',
          published_year: book.published_year ? String(book.published_year) : '',
          cover_image_url: book.cover_image_url ?? '',
        })
      })
      .catch(() => {
        toast.error('Ном олдсонгүй')
        router.push('/admin/books')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : undefined,
          published_year: formData.published_year ? parseInt(formData.published_year) : null,
          cover_image_url: formData.cover_image_url || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update book')
      }

      toast.success('Ном амжилттай шинэчлэгдлээ')
      router.push('/admin/books')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Edit Book</h1>
        <Card className="max-w-2xl">
          <CardContent className="py-8">Ачаалж байна...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Edit Book</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Book Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₮) *</Label>
                <Input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="published_year">Published Year</Label>
                <Input
                  id="published_year"
                  type="number"
                  min="1900"
                  max="2100"
                  value={formData.published_year}
                  onChange={(e) => setFormData({ ...formData, published_year: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image_url">Cover Image URL</Label>
              <Input
                id="cover_image_url"
                type="url"
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/books">Буцах</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
