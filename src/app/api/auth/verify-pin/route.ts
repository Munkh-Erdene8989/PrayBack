import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/auth/pin'
import { createSession } from '@/lib/auth/session'
import { z } from 'zod'

const verifyPINSchema = z.object({
  phone: z.string().min(8),
  pin: z.string().length(6, 'PIN must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, pin } = verifyPINSchema.parse(body)

    const supabase = await createAdminClient()

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, pin_hash, phone, role')
      .eq('phone', phone)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.pin_hash) {
      return NextResponse.json(
        { error: 'PIN not set' },
        { status: 400 }
      )
    }

    // Verify PIN
    const isValid = await verifyPin(pin, user.pin_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    const role = (user.role as 'customer' | 'superadmin') || 'customer'

    // Create session
    await createSession({
      userId: user.id,
      phone: user.phone,
      role,
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      role,
    })
  } catch (error) {
    console.error('Verify PIN error:', error)
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    )
  }
}
