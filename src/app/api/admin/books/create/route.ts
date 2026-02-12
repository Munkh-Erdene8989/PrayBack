import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  // stock_quantity removed - digital books don't need inventory tracking
  category: z.string().optional(),
  published_year: z.number().optional().nullable(),
  cover_image_url: z.string().url().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bookData = createBookSchema.parse(body)

    const supabase = await createAdminClient()

    const { data: book, error } = await supabase
      .from('books')
      .insert({
        ...bookData,
        cover_image_url: bookData.cover_image_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Book creation error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create book' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      book,
    })
  } catch (error: any) {
    console.error('Create book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create book' },
      { status: 500 }
    )
  }
}
