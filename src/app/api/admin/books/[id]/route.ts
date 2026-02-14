import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  category: z.string().optional().nullable(),
  published_year: z.number().optional().nullable(),
  cover_image_url: z.string().url().optional().or(z.literal('')).nullable(),
  is_active: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ book })
  } catch (error) {
    console.error('Get book error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updates = updateBookSchema.parse(body)

    const supabase = await createAdminClient()

    const payload: Record<string, unknown> = { ...updates }
    if (payload.cover_image_url === '') payload.cover_image_url = null

    const { data: book, error } = await supabase
      .from('books')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Book update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update book' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, book })
  } catch (error: any) {
    console.error('Update book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update book' },
      { status: 500 }
    )
  }
}
