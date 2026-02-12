import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashPin, validatePin } from '@/lib/auth/pin'
import { createSession } from '@/lib/auth/session'
import { z } from 'zod'

const createPINSchema = z.object({
  userId: z.string().uuid(),
  pin: z.string().length(6, 'PIN must be 6 digits'),
  phone: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, pin, phone } = createPINSchema.parse(body)

    // Validate PIN format
    if (!validatePin(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 6 digits' },
        { status: 400 }
      )
    }

    // Hash the PIN
    const pinHash = await hashPin(pin)

    const supabase = await createAdminClient()

    // Update user with PIN
    const { error: updateError } = await supabase
      .from('users')
      .update({
        pin_hash: pinHash,
        pin_set_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('PIN update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to create PIN' },
        { status: 500 }
      )
    }

    // Create session
    await createSession({
      userId: userId,
      phone: phone,
      role: 'customer',
    })

    return NextResponse.json({
      success: true,
      message: 'PIN created successfully',
    })
  } catch (error) {
    console.error('Create PIN error:', error)
    return NextResponse.json(
      { error: 'Failed to create PIN' },
      { status: 500 }
    )
  }
}
