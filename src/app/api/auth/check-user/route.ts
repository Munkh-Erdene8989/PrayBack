import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const checkUserSchema = z.object({
  phone: z.string().min(8, 'Phone number is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = checkUserSchema.parse(body)

    const supabase = await createAdminClient()

    // Check if user exists with this phone
    const { data: user, error } = await supabase
      .from('users')
      .select('id, pin_hash, phone')
      .eq('phone', phone)
      .single()

    if (error || !user) {
      return NextResponse.json({
        exists: false,
        hasPin: false,
      })
    }

    return NextResponse.json({
      exists: true,
      hasPin: !!user.pin_hash,
      userId: user.id,
    })
  } catch (error) {
    console.error('Check user error:', error)
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    )
  }
}
